/**
 * Parsing and validation of Standvirtual advert URLs for the import flows
 * (plan 24, wave 1). Pure functions, no I/O — the same validation runs on the
 * client (batch table) and on the server (anti-SSRF gate before any fetch).
 */

/** Hard cap of adverts per batch — exceeding it warns, never truncates silently. */
export const MAX_IMPORT_BATCH_SIZE = 25;

const STANDVIRTUAL_HOSTS = new Set(['standvirtual.com', 'www.standvirtual.com']);

/** Advert pages always end in “…-ID<token>.html”; the token identifies the ad. */
const AD_ID_PATTERN = /-ID([A-Za-z0-9]+)\.html$/;

export interface ParsedImportUrl {
  /** The input as the user provided it (trimmed). */
  raw: string;
  /** Canonical https://www.standvirtual.com URL without query/hash. */
  normalizedUrl?: string;
  /** The ID token from the URL — stable across slug changes; used as origemId. */
  adId?: string;
  valid: boolean;
  /** User-facing (PT) reason when invalid. */
  reason?: string;
}

export function extractStandvirtualAdId(url: string): string | null {
  let pathname: string;
  try {
    pathname = new URL(url).pathname;
  } catch {
    pathname = url;
  }
  return AD_ID_PATTERN.exec(pathname)?.[1] ?? null;
}

export function validateStandvirtualUrl(input: string): ParsedImportUrl {
  const raw = input.trim();
  const invalid = (reason: string): ParsedImportUrl => ({ raw, valid: false, reason });
  if (!raw) return invalid('URL vazio.');

  // Tolerate protocol-less input ("www.standvirtual.com/…").
  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;

  let url: URL;
  try {
    url = new URL(withProtocol);
  } catch {
    return invalid('Não é um URL válido.');
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return invalid('Não é um URL válido.');
  }
  if (!STANDVIRTUAL_HOSTS.has(url.hostname.toLowerCase())) {
    return invalid('O URL não é do Standvirtual.');
  }
  const adId = AD_ID_PATTERN.exec(url.pathname)?.[1];
  if (!adId) {
    return invalid('Não parece ser o URL de um anúncio (termina em “…-ID….html”).');
  }
  return {
    raw,
    valid: true,
    adId,
    normalizedUrl: `https://www.standvirtual.com${url.pathname}`,
  };
}

/**
 * Pulls URL-looking tokens out of free text — pasted lists (newline / comma /
 * space separated) and .txt/.csv file contents alike. Tolerant by design:
 * anything that carries a protocol or mentions standvirtual.com is kept (bad
 * ones get flagged by validation later); headers, blanks and other CSV
 * columns are ignored.
 */
export function extractUrlsFromText(text: string): string[] {
  const urls: string[] = [];
  for (const token of text.split(/[\s,;"']+/)) {
    const trimmed = token.trim();
    if (!trimmed) continue;
    if (/^https?:\/\//i.test(trimmed) || /^(www\.)?standvirtual\.com\//i.test(trimmed)) {
      urls.push(trimmed);
    }
  }
  return urls;
}

/** Validates a list of inputs and drops duplicates (same advert id or same URL). */
export function buildUrlBatch(inputs: string[]): ParsedImportUrl[] {
  const seen = new Set<string>();
  const batch: ParsedImportUrl[] = [];
  for (const input of inputs) {
    const parsed = validateStandvirtualUrl(input);
    const key = parsed.adId ?? parsed.raw;
    if (seen.has(key)) continue;
    seen.add(key);
    batch.push(parsed);
  }
  return batch;
}
