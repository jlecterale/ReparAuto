import { type Country } from '@/lib/country';

/**
 * Parsing and validation of vehicle advert URLs for the import flows
 * (plan 24, wave 1 and plan 26 expansion). Pure functions, no I/O — the same
 * validation runs on the client (batch table) and on the server.
 */

/** Hard cap of adverts per batch — exceeding it warns, never truncates silently. */
export const MAX_IMPORT_BATCH_SIZE = 25;

const STANDVIRTUAL_HOSTS = new Set(['standvirtual.com', 'www.standvirtual.com']);
const WEBMOTORS_HOSTS = new Set(['webmotors.com.br', 'www.webmotors.com.br']);

/** Advert pages always end in “…-ID<token>.html”; the token identifies the ad. */
const AD_ID_PATTERN = /-ID([A-Za-z0-9]+)\.html$/;

export interface ParsedImportUrl {
  /** The input as the user provided it (trimmed). */
  raw: string;
  /** Canonical URL without query/hash. */
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

export function validateWebmotorsUrl(input: string): ParsedImportUrl {
  const raw = input.trim();
  const invalid = (reason: string): ParsedImportUrl => ({ raw, valid: false, reason });
  if (!raw) return invalid('URL vazio.');

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
  if (!WEBMOTORS_HOSTS.has(url.hostname.toLowerCase())) {
    return invalid('O URL não é do Webmotors.');
  }
  if (!url.pathname.startsWith('/comprar/')) {
    return invalid('Não parece ser o URL de um anúncio do Webmotors (deve começar com /comprar/).');
  }
  const cleanPath = url.pathname.replace(/\/$/, '');
  const segments = cleanPath.split('/');
  const adId = segments[segments.length - 1];
  if (!adId || adId === 'comprar') {
    return invalid('ID do anúncio não encontrado no URL.');
  }
  return {
    raw,
    valid: true,
    adId,
    normalizedUrl: `https://www.webmotors.com.br${cleanPath}`,
  };
}

export function validateImportUrl(input: string, country: Country): ParsedImportUrl {
  if (country === 'BR') {
    return validateWebmotorsUrl(input);
  }
  return validateStandvirtualUrl(input);
}

export interface ParsedInventoryUrl {
  raw: string;
  valid: boolean;
  reason?: string;
  /** Canonical https://<slug>.standvirtual.com/inventory URL. */
  normalizedUrl?: string;
  /** The dealer's subdomain slug (e.g. "nicolacar"). */
  standSlug?: string;
}

// One label + the standvirtual.com apex — dealer pages live on subdomains.
const STAND_SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

/**
 * Validates a dealer stand-page URL ("<slug>.standvirtual.com"), the source
 * for whole-inventory discovery. Any path is tolerated (users paste the stand
 * homepage as often as /inventory) and normalized to the inventory page.
 */
export function validateStandvirtualInventoryUrl(input: string): ParsedInventoryUrl {
  const raw = input.trim();
  const invalid = (reason: string): ParsedInventoryUrl => ({ raw, valid: false, reason });
  if (!raw) return invalid('URL vazio.');

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
  const host = url.hostname.toLowerCase();
  if (!host.endsWith('.standvirtual.com')) {
    return invalid('O URL não é a página de um stand no Standvirtual.');
  }
  const slug = host.slice(0, -'.standvirtual.com'.length);
  if (slug === 'www' || !STAND_SLUG_PATTERN.test(slug)) {
    return invalid('Use o endereço do seu stand (ex.: omeustand.standvirtual.com).');
  }
  return {
    raw,
    valid: true,
    standSlug: slug,
    normalizedUrl: `https://${slug}.standvirtual.com/inventory`,
  };
}

/**
 * Pulls URL-looking tokens out of free text — pasted lists (newline / comma /
 * space separated) and .txt/.csv file contents alike. Tolerant by design:
 * anything that carries a protocol or mentions standvirtual.com/webmotors.com.br is kept.
 */
export function extractUrlsFromText(text: string): string[] {
  const urls: string[] = [];
  for (const token of text.split(/[\s,;"']+/)) {
    const trimmed = token.trim();
    if (!trimmed) continue;
    if (
      /^https?:\/\//i.test(trimmed) ||
      /^(www\.)?standvirtual\.com\//i.test(trimmed) ||
      /^(www\.)?webmotors\.com\.br\//i.test(trimmed)
    ) {
      urls.push(trimmed);
    }
  }
  return urls;
}

/** Validates a list of inputs and drops duplicates (same advert id or same URL). */
export function buildUrlBatch(inputs: string[], country: Country): ParsedImportUrl[] {
  const seen = new Set<string>();
  const batch: ParsedImportUrl[] = [];
  for (const input of inputs) {
    const parsed = validateImportUrl(input, country);
    const key = parsed.adId ?? parsed.raw;
    if (seen.has(key)) continue;
    seen.add(key);
    batch.push(parsed);
  }
  return batch;
}
