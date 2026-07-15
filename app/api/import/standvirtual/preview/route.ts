import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/requireUser';
import { internalErrorResponse } from '@/lib/server/routeError';
import { checkImportRateLimit, fetchAndMapAdvert } from '@/lib/importers/standvirtual.server';
import { validateStandvirtualUrl } from '@/lib/importers/urlList';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST { url } — single-URL flow (plan 24 §05.4). Fetches one advert,
 * maps it to the car form shape and returns it for the Anunciar prefill.
 * Writes nothing.
 */
export async function POST(request: Request) {
  try {
    return await handlePreview(request);
  } catch (err) {
    return internalErrorResponse('api/import/standvirtual/preview', err);
  }
}

async function handlePreview(request: Request) {
  const auth = await requireUser(request);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  if (!auth.user.emailVerified) {
    return NextResponse.json({ error: 'email_not_verified' }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { url?: unknown } | null;
  const parsed = validateStandvirtualUrl(typeof body?.url === 'string' ? body.url : '');
  if (!parsed.valid || !parsed.normalizedUrl) {
    return NextResponse.json({ error: 'invalid_url' }, { status: 400 });
  }

  const rate = checkImportRateLimit(auth.user.uid);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rate.retryAfterMs ?? 60_000) / 1000)) } },
    );
  }

  const result = await fetchAndMapAdvert(parsed.normalizedUrl);
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

  const { advert, mapped } = result;
  return NextResponse.json({
    adId: advert.adId,
    url: advert.url,
    title: advert.title,
    active: advert.active,
    dados: mapped.dados,
    fotos: advert.photos,
    unmappedFields: mapped.unmappedFields,
  });
}
