import 'server-only';
import {
  extractAdvertUrlsFromHtml,
  extractNextData,
  isBlockedHtml,
  normalizeInventoryPage,
  normalizeStandvirtualAdvert,
  type NormalizedAdvert,
} from '@/lib/importers/standvirtual.nextdata';
import { mapAdvertToCarroFormData, type MappedAdvert } from '@/lib/importers/standvirtual.map';
import { createRateLimiter, type RateLimitResult } from '@/lib/importers/rateLimit';
import { validateStandvirtualInventoryUrl, validateStandvirtualUrl } from '@/lib/importers/urlList';

const FETCH_TIMEOUT_MS = 15_000;
const MAX_HTML_BYTES = 5 * 1024 * 1024;
/** Minimum spacing between outbound Standvirtual requests from this instance. */
const MIN_FETCH_GAP_MS = 500;
const MAX_FETCH_JITTER_MS = 400;

// A stable, honest browser User-Agent — Standvirtual serves the full SSR page
// to browsers; the default undici UA draws the DataDome interstitial faster.
const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

// Shared between preview and import (both trigger an outbound fetch): a
// serial 25-item batch at client pace stays well inside these windows; a
// script hammering the routes does not.
const perMinuteLimiter = createRateLimiter({ windowMs: 60_000, max: 20 });
const perHourLimiter = createRateLimiter({ windowMs: 3_600_000, max: 120 });

/** Per-user rate limit for the import API routes (open to all signed-in users). */
export function checkImportRateLimit(uid: string): RateLimitResult {
  const minute = perMinuteLimiter.check(uid);
  if (!minute.allowed) return minute;
  return perHourLimiter.check(uid);
}

export type StandvirtualFetchResult =
  | { outcome: 'ok'; html: string }
  | { outcome: 'blocked' }
  | { outcome: 'not_found' }
  | { outcome: 'error' };

// All outbound advert fetches on this instance are serialized with a small
// gap + jitter, regardless of how many users import at once — the client
// batch flow is already serial per user; this is the server-side backstop.
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
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'pt-PT,pt;q=0.9',
      },
    });
  } finally {
    lastFetchAt = Date.now();
  }
}

type FetchKind = 'advert' | 'inventory';

function isAllowedFetchUrl(url: string, kind: FetchKind): boolean {
  return kind === 'advert'
    ? validateStandvirtualUrl(url).valid
    : validateStandvirtualInventoryUrl(url).valid;
}

/**
 * Fetches a Standvirtual page (advert or dealer inventory). The URL must
 * already have passed the matching validator — this function re-checks it
 * and also verifies the post-redirect host, so no request can ever leave
 * for another origin.
 */
export async function fetchStandvirtualHtml(
  url: string,
  kind: FetchKind = 'advert',
): Promise<StandvirtualFetchResult> {
  if (!isAllowedFetchUrl(url, kind)) return { outcome: 'error' };

  const run = fetchChain.then(async (): Promise<StandvirtualFetchResult> => {
    let response: Response;
    try {
      response = await paceAndFetch(url);
    } catch {
      return { outcome: 'error' };
    }
    // fetch() follows redirects — never accept a hop off standvirtual.com.
    if (response.url && !isAllowedFetchUrl(response.url, kind)) {
      return { outcome: 'error' };
    }
    if (response.status === 404 || response.status === 410) return { outcome: 'not_found' };
    if (response.status === 403 || response.status === 429) return { outcome: 'blocked' };
    if (!response.ok) return { outcome: 'error' };

    const html = await response.text();
    if (html.length > MAX_HTML_BYTES) return { outcome: 'error' };
    if (isBlockedHtml(html)) return { outcome: 'blocked' };
    return { outcome: 'ok', html };
  });
  // Chain regardless of outcome so concurrent calls stay serialized.
  fetchChain = run.catch(() => undefined);
  return run;
}

export type AdvertPipelineResult =
  | { outcome: 'ok'; advert: NormalizedAdvert; mapped: MappedAdvert }
  | { outcome: 'blocked' }
  | { outcome: 'not_found' }
  | { outcome: 'parse_failed' }
  | { outcome: 'error' };

/** Shared preview/import pipeline: fetch → __NEXT_DATA__ → normalize → map. */
export async function fetchAndMapAdvert(url: string): Promise<AdvertPipelineResult> {
  const fetched = await fetchStandvirtualHtml(url);
  if (fetched.outcome !== 'ok') return fetched;

  const nextData = extractNextData(fetched.html);
  const advert = nextData ? normalizeStandvirtualAdvert(nextData, url) : null;
  if (!advert) return { outcome: 'parse_failed' };

  return { outcome: 'ok', advert, mapped: mapAdvertToCarroFormData(advert) };
}

/** Hard cap of inventory pages crawled per discovery request (30 ads/page). */
const MAX_INVENTORY_PAGES = 10;

export type InventoryDiscoveryResult =
  | { outcome: 'ok'; adUrls: string[]; total: number | null; truncated: boolean }
  | { outcome: 'blocked' }
  | { outcome: 'not_found' }
  | { outcome: 'parse_failed' }
  | { outcome: 'error' };

/**
 * Whole-stand discovery (verified professionals): walks the dealer's
 * /inventory pages — serialized and paced like every other Standvirtual
 * fetch — and returns the advert URLs found. Writes nothing; the client
 * feeds the list into the normal validated batch flow.
 *
 * `canFetchNextPage` is consulted before each extra page so the caller can
 * charge pagination against its rate limit; a denied page (or a mid-crawl
 * block) stops gracefully and reports the partial list as truncated.
 */
export async function discoverInventoryAdUrls(
  inventoryUrl: string,
  canFetchNextPage: () => boolean = () => true,
): Promise<InventoryDiscoveryResult> {
  const first = await fetchStandvirtualHtml(inventoryUrl, 'inventory');
  if (first.outcome !== 'ok') return first;

  const firstPage = normalizeInventoryPage(extractNextData(first.html));
  const adUrls = new Set<string>(firstPage?.adUrls ?? extractAdvertUrlsFromHtml(first.html));
  if (!firstPage && adUrls.size === 0) return { outcome: 'parse_failed' };

  const total = firstPage?.total ?? null;
  const pageSize = firstPage?.pageSize ?? null;
  const pageCount = total && pageSize ? Math.ceil(total / pageSize) : 1;
  let truncated = pageCount > MAX_INVENTORY_PAGES;

  for (let page = 2; page <= Math.min(pageCount, MAX_INVENTORY_PAGES); page++) {
    if (!canFetchNextPage()) {
      truncated = true;
      break;
    }
    const fetched = await fetchStandvirtualHtml(`${inventoryUrl}?page=${page}`, 'inventory');
    if (fetched.outcome !== 'ok') {
      truncated = true;
      break;
    }
    const parsed = normalizeInventoryPage(extractNextData(fetched.html));
    for (const url of parsed?.adUrls ?? extractAdvertUrlsFromHtml(fetched.html)) {
      adUrls.add(url);
    }
  }

  return { outcome: 'ok', adUrls: [...adUrls], total, truncated };
}
