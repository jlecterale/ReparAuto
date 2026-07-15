import { NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase.admin';
import { isAdminUser, requireUser } from '@/lib/server/requireUser';
import { internalErrorResponse } from '@/lib/server/routeError';
import { checkImportRateLimit, fetchAndMapAdvert } from '@/lib/importers/standvirtual.server';
import { buildCarroPayload } from '@/lib/importers/standvirtual.map';
import { rehostAdvertPhotos } from '@/lib/importers/photos';
import { validateStandvirtualUrl } from '@/lib/importers/urlList';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ImportRequestBody {
  url?: unknown;
  /**
   * User flow: "this listing is mine and I have the rights to the photos."
   * Admin-on-behalf flow: "the client authorized importing their listings."
   */
  attestOwnership?: unknown;
  /** Admin only: create the car under this user's account instead of the caller's. */
  targetUid?: unknown;
}

async function findExistingImport(uid: string, adId: string): Promise<string | null> {
  const db = getAdminDb();
  if (!db) return null;
  const snap = await db
    .collection('cars')
    .where('criadorUid', '==', uid)
    .where('origem', '==', 'standvirtual')
    .where('origemId', '==', adId)
    .limit(1)
    .get();
  return snap.empty ? null : snap.docs[0].id;
}

/** Mirrors the manual publish flow: alert admins that a listing awaits review. */
async function notifyAdminsOfPendingCar(titulo: string, carId: string): Promise<void> {
  const db = getAdminDb();
  if (!db) return;
  const admins = await db.collection('users').where('role', '==', 'admin').get();
  await Promise.all(
    admins.docs.map((admin) =>
      db.collection('notifications').add({
        uid: admin.id,
        tipo: 'info',
        titulo: 'Novo anúncio pendente',
        mensagem: `Um carro foi importado do Standvirtual: ${titulo}.`,
        link: `/detalhes/${carId}`,
        lida: false,
        dataCriacao: Timestamp.now(),
      }),
    ),
  );
}

/**
 * POST { url, attestOwnership } — creates ONE car draft (status 'pendente')
 * from a Standvirtual advert. One unit per call, idempotent by origemId: the
 * client batch flow calls it serially, URL by URL.
 */
export async function POST(request: Request) {
  try {
    return await handleImport(request);
  } catch (err) {
    return internalErrorResponse('api/import/standvirtual/import', err);
  }
}

async function handleImport(request: Request) {
  const auth = await requireUser(request);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  if (!auth.user.emailVerified) {
    return NextResponse.json({ error: 'email_not_verified' }, { status: 403 });
  }
  const { uid, email } = auth.user;

  const body = (await request.json().catch(() => null)) as ImportRequestBody | null;
  if (body?.attestOwnership !== true) {
    return NextResponse.json({ error: 'attestation_required' }, { status: 400 });
  }
  const parsed = validateStandvirtualUrl(typeof body?.url === 'string' ? body.url : '');
  if (!parsed.valid || !parsed.normalizedUrl || !parsed.adId) {
    return NextResponse.json({ error: 'invalid_url' }, { status: 400 });
  }

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ error: 'server_unavailable' }, { status: 503 });
  }

  // Admin-on-behalf (PR #78 discussion): the car is created under the target
  // client's account; the caller is recorded in importadoPor for audit.
  const targetUid = typeof body?.targetUid === 'string' && body.targetUid ? body.targetUid : null;
  let owner = { uid, email };
  let importadoPor: string | undefined;
  if (targetUid && targetUid !== uid) {
    if (!(await isAdminUser(auth.user))) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    const targetSnap = await db.collection('users').doc(targetUid).get();
    const target = targetSnap.exists ? (targetSnap.data() as { email?: string }) : null;
    if (!target?.email) {
      return NextResponse.json({ error: 'target_not_found' }, { status: 400 });
    }
    owner = { uid: targetUid, email: target.email };
    importadoPor = uid;
  }

  // Idempotency first — a re-run of the same batch must not refetch, and
  // must not burn the user's rate-limit budget.
  const existingId = await findExistingImport(owner.uid, parsed.adId);
  if (existingId) {
    return NextResponse.json({ status: 'duplicate', carId: existingId });
  }

  const rate = checkImportRateLimit(uid);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rate.retryAfterMs ?? 60_000) / 1000)) } },
    );
  }

  const result = await fetchAndMapAdvert(parsed.normalizedUrl);
  if (result.outcome === 'blocked') {
    return NextResponse.json({ status: 'blocked' });
  }
  if (result.outcome === 'not_found') {
    return NextResponse.json({ status: 'failed', reason: 'not_found' });
  }
  if (result.outcome === 'parse_failed') {
    return NextResponse.json({ status: 'failed', reason: 'parse_failed' });
  }
  if (result.outcome !== 'ok') {
    return NextResponse.json({ status: 'failed', reason: 'fetch_failed' });
  }
  const { advert, mapped } = result;

  // The canonical advert URL is authoritative for the id (slug redirects).
  if (advert.adId !== parsed.adId) {
    const canonicalExisting = await findExistingImport(owner.uid, advert.adId);
    if (canonicalExisting) {
      return NextResponse.json({ status: 'duplicate', carId: canonicalExisting });
    }
  }

  const { fotos, failedCount } = await rehostAdvertPhotos(advert.photos, {
    uid: owner.uid,
    adId: advert.adId,
  });

  // Contacts always come from the owner's RecarGarage profile — the source
  // advert's phone is tokenized on purpose and is never reconstructed (RGPD).
  const profileSnap = await db.collection('users').doc(owner.uid).get();
  const profile = profileSnap.exists ? (profileSnap.data() as { nome?: string; telefone?: string }) : {};
  const telefone = profile.telefone || null;

  const now = Timestamp.now();
  const docRef = await db.collection('cars').add({
    ...buildCarroPayload(mapped.dados),
    fotos,
    criador: owner.email,
    criadorUid: owner.uid,
    vendedorNome: profile.nome || owner.email.split('@')[0],
    vendedorTelefone: telefone,
    vendedorWhatsApp: telefone,
    vendedorEmail: owner.email,
    status: 'pendente',
    origem: 'standvirtual',
    origemId: advert.adId,
    origemUrl: advert.url,
    ...(importadoPor ? { importadoPor } : {}),
    importadoEm: now,
    dataCriacao: now,
  });

  const titulo = [mapped.dados.marca, mapped.dados.modelo].filter(Boolean).join(' ') || advert.title;
  notifyAdminsOfPendingCar(titulo, docRef.id).catch(() => {});

  return NextResponse.json({
    status: 'created',
    carId: docRef.id,
    unmappedFields: mapped.unmappedFields,
    failedPhotoCount: failedCount,
  });
}
