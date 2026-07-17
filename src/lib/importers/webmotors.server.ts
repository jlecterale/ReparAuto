import 'server-only';
import { normalizeWebmotorsAdvert } from '@/lib/importers/webmotors.nextdata';
import { mapWebmotorsAdvertToCarroFormData, type MappedAdvert } from '@/lib/importers/webmotors.map';
import { checkImportRateLimit } from '@/lib/importers/standvirtual.server';
import { validateWebmotorsUrl } from '@/lib/importers/urlList';
import type { NormalizedAdvert } from '@/lib/importers/standvirtual.nextdata';

const FETCH_TIMEOUT_MS = 15_000;
const MAX_HTML_BYTES = 5 * 1024 * 1024;
const MIN_FETCH_GAP_MS = 1000; // slightly longer gap for Webmotors to respect their server
const MAX_FETCH_JITTER_MS = 500;

const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

export type WebmotorsFetchResult =
  | { outcome: 'ok'; html: string }
  | { outcome: 'blocked' }
  | { outcome: 'not_found' }
  | { outcome: 'error' };

let fetchChain: Promise<unknown> = Promise.resolve();
let lastFetchAt = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function paceAndFetch(url: string): Promise<Response> {
  const gap = MIN_FETCH_GAP_MS + Math.random() * MAX_FETCH_JITTER_MS;
  const waitMs = Math.max(0, lastFetchAt + gap - Date.now());
  if (waitMs > 0) await sleep(waitMs);
  try {
    return await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        'User-Agent': BROWSER_USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
    });
  } finally {
    lastFetchAt = Date.now();
  }
}

export async function fetchWebmotorsHtml(url: string): Promise<WebmotorsFetchResult> {
  if (!validateWebmotorsUrl(url).valid) return { outcome: 'error' };

  const run = fetchChain.then(async (): Promise<WebmotorsFetchResult> => {
    let response: Response;
    try {
      response = await paceAndFetch(url);
    } catch {
      return { outcome: 'error' };
    }

    if (response.url && !validateWebmotorsUrl(response.url).valid) {
      return { outcome: 'error' };
    }
    
    // Check if blocked by PerimeterX or cloudflare
    if (response.status === 403 || response.status === 429) return { outcome: 'blocked' };
    if (response.status === 404 || response.status === 410) return { outcome: 'not_found' };
    if (!response.ok) return { outcome: 'error' };

    const html = await response.text();
    if (html.length > MAX_HTML_BYTES) return { outcome: 'error' };
    
    if (/captcha-delivery\.com|geo\.captcha-delivery|datadome|px-captcha|perimeterx/i.test(html)) {
      return { outcome: 'blocked' };
    }
    
    return { outcome: 'ok', html };
  });

  fetchChain = run.catch(() => undefined);
  return run;
}

export type WebmotorsPipelineResult =
  | { outcome: 'ok'; advert: NormalizedAdvert; mapped: MappedAdvert }
  | { outcome: 'blocked' }
  | { outcome: 'not_found' }
  | { outcome: 'parse_failed' }
  | { outcome: 'error' };

/**
 * Pipeline to fetch (or receive pasted HTML) and extract vehicle data.
 */
export async function fetchAndMapWebmotorsAdvert(
  url: string,
  htmlOverride?: string,
): Promise<WebmotorsPipelineResult> {
  let html = htmlOverride || '';
  
  if (!html) {
    const fetched = await fetchWebmotorsHtml(url);
    if (fetched.outcome !== 'ok') return fetched;
    html = fetched.html;
  }

  const advert = normalizeWebmotorsAdvert(html, url);
  if (!advert) return { outcome: 'parse_failed' };

  return {
    outcome: 'ok',
    advert,
    mapped: mapWebmotorsAdvertToCarroFormData(advert),
  };
}
export { checkImportRateLimit };
