import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase.admin';
import { isAdminUser, requireUser } from '@/lib/server/requireUser';
import { internalErrorResponse } from '@/lib/server/routeError';
import { checkImportRateLimit, discoverInventoryAdUrls } from '@/lib/importers/standvirtual.server';
import { validateStandvirtualInventoryUrl } from '@/lib/importers/urlList';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST { url } — whole-stand discovery: walks a dealer's /inventory pages and
 * returns the advert URLs found, for the client to feed into the normal batch
 * flow. Writes nothing. Restricted to professional accounts whose
 * documentation was validated by an admin (users/{uid}.verificado, set on
 * verification approval) — the closest ownership signal route B can offer.
 */
export async function POST(request: Request) {
  try {
    return await handleInventory(request);
  } catch (err) {
    return internalErrorResponse('api/import/standvirtual/inventory', err);
  }
}

async function handleInventory(request: Request) {
  const auth = await requireUser(request);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  if (!auth.user.emailVerified) {
    return NextResponse.json({ error: 'email_not_verified' }, { status: 403 });
  }
  const { uid } = auth.user;

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ error: 'server_unavailable' }, { status: 503 });
  }

  // Admins run discovery on behalf of clients (PR #78 discussion); everyone
  // else needs a professional account with validated documentation.
  if (!(await isAdminUser(auth.user))) {
    const profileSnap = await db.collection('users').doc(uid).get();
    const profile = profileSnap.exists
      ? (profileSnap.data() as { tipoConta?: string; verificado?: boolean })
      : {};
    if (profile.tipoConta !== 'profissional' || profile.verificado !== true) {
      return NextResponse.json({ error: 'professional_verification_required' }, { status: 403 });
    }
  }

  const body = (await request.json().catch(() => null)) as { url?: unknown } | null;
  const parsed = validateStandvirtualInventoryUrl(typeof body?.url === 'string' ? body.url : '');
  if (!parsed.valid || !parsed.normalizedUrl) {
    return NextResponse.json({ error: 'invalid_url' }, { status: 400 });
  }

  const rate = checkImportRateLimit(uid);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rate.retryAfterMs ?? 60_000) / 1000)) } },
    );
  }

  // Extra pages are charged against the same per-user budget.
  const result = await discoverInventoryAdUrls(
    parsed.normalizedUrl,
    () => checkImportRateLimit(uid).allowed,
  );
  if (result.outcome === 'blocked') {
    return NextResponse.json({ error: 'blocked' }, { status: 502 });
  }
  if (result.outcome === 'not_found') {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  if (result.outcome === 'parse_failed') {
    return NextResponse.json({ error: 'parse_failed' }, { status: 502 });
  }
  if (result.outcome !== 'ok') {
    return NextResponse.json({ error: 'fetch_failed' }, { status: 502 });
  }

  return NextResponse.json({
    urls: result.adUrls,
    total: result.total,
    truncated: result.truncated,
  });
}
