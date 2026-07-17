import { NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase.admin';
import { isAdminUser, requireUser } from '@/lib/server/requireUser';
import { internalErrorResponse } from '@/lib/server/routeError';
import { checkImportRateLimit, fetchAndMapWebmotorsAdvert } from '@/lib/importers/webmotors.server';
import { buildWebmotorsCarroPayload } from '@/lib/importers/webmotors.map';
import { rehostAdvertPhotos } from '@/lib/importers/photos';
import { validateWebmotorsUrl } from '@/lib/importers/urlList';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ImportRequestBody {
  url?: unknown;
  html?: unknown;
  attestOwnership?: unknown;
  targetUid?: unknown;
}

async function findExistingImport(uid: string, adId: string): Promise<string | null> {
  const db = getAdminDb();
  if (!db) return null;
  const snap = await db
    .collection('cars')
    .where('criadorUid', '==', uid)
    .where('origem', '==', 'webmotors')
    .where('origemId', '==', adId)
    .limit(1)
    .get();
  return snap.empty ? null : snap.docs[0].id;
}

async function notifyAdminsOfPendingCar(titulo: string, carId: string): Promise<void> {
  const db = getAdminDb();
  if (!db) return;
  const admins = await db.collection('users').where('role', '==', 'admin').get();
  await Promise.all(
    admins.docs.map((admin) =>
      db.collection('notifications').add({
        uid: admin.id,
        tipo: 'info',
        titulo: 'Novo anúncio pendente (Brasil)',
        mensagem: `Um carro foi importado do Webmotors: ${titulo}.`,
        link: `/detalhes/${carId}`,
        lida: false,
        dataCriacao: Timestamp.now(),
      }),
    ),
  );
}

export async function POST(request: Request) {
  try {
    return await handleImport(request);
  } catch (err) {
    return internalErrorResponse('api/import/webmotors/import', err);
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

  const urlStr = typeof body?.url === 'string' ? body.url : '';
  const htmlStr = typeof body?.html === 'string' ? body.html : undefined;

  const parsed = validateWebmotorsUrl(urlStr);
  if (!parsed.valid || !parsed.normalizedUrl || !parsed.adId) {
    return NextResponse.json({ error: 'invalid_url' }, { status: 400 });
  }

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ error: 'server_unavailable' }, { status: 503 });
  }

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

  // Idempotency check
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

  const result = await fetchAndMapWebmotorsAdvert(parsed.normalizedUrl, htmlStr);
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

  const profileSnap = await db.collection('users').doc(owner.uid).get();
  const profile = profileSnap.exists ? (profileSnap.data() as { nome?: string; telefone?: string }) : {};
  const telefone = profile.telefone || null;

  const now = Timestamp.now();
  const docRef = await db.collection('cars').add({
    ...buildWebmotorsCarroPayload(mapped.dados),
    fotos,
    criador: owner.email,
    criadorUid: owner.uid,
    vendedorNome: profile.nome || owner.email.split('@')[0],
    vendedorTelefone: telefone,
    vendedorWhatsApp: telefone,
    vendedorEmail: owner.email,
    status: 'pendente',
    origem: 'webmotors',
    origemId: advert.adId,
    origemUrl: advert.url,
    country: 'BR', // Force country BR
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
