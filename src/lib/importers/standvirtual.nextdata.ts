/**
 * Standvirtual advert extraction via the page's __NEXT_DATA__ blob (plan 24,
 * route B). Pure functions over an HTML string / parsed JSON — the server
 * route does the fetching. `NormalizedAdvert` is the intermediate shape the
 * field mapper consumes; the future official-API importer (route A) should
 * normalize into this same shape.
 */

import { extractStandvirtualAdId } from '@/lib/importers/urlList';

export interface NormalizedAdvertLocation {
  /** Display city/freguesia name (e.g. "Viatodos, Grimancelos…"). */
  city?: string;
  /** Canonical concelho slug (e.g. "barcelos"), without the district suffix. */
  concelhoSlug?: string;
  /** Display district name (e.g. "Braga"). */
  region?: string;
}

export interface NormalizedAdvert {
  /** ID token from the advert URL — stable across slug changes. */
  adId: string;
  /** Canonical advert URL as published by Standvirtual. */
  url: string;
  title: string;
  /** Raw description HTML (sanitized later by the mapper). */
  descriptionHtml: string;
  priceValue: number | null;
  currency: string | null;
  photos: string[];
  /** parametersDict flattened to key → { value: slug, label: PT display }. */
  params: Record<string, { value: string; label: string }>;
  /** Flat equipment option keys (e.g. "bluetooth_interface"). */
  equipmentKeys: string[];
  location: NormalizedAdvertLocation;
  /** Whether Standvirtual still lists the advert as active. */
  active: boolean;
}

const NEXT_DATA_RE =
  /<script\s+id="__NEXT_DATA__"\s+type="application\/json"[^>]*>([\s\S]*?)<\/script>/;

export function extractNextData(html: string): unknown | null {
  const match = NEXT_DATA_RE.exec(html);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

/**
 * DataDome serves a small challenge interstitial instead of the ad when it
 * suspects automation. Real ad pages also load the DataDome JS tag, so the
 * marker alone is not enough — a blocked page is one with challenge markers
 * AND no __NEXT_DATA__ payload.
 */
export function isBlockedHtml(html: string): boolean {
  if (html.includes('__NEXT_DATA__')) return false;
  return /captcha-delivery\.com|geo\.captcha-delivery|datadome/i.test(html);
}

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as UnknownRecord) : null;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined;
}

/** parametersDict entries carry `values: [{ value, label }]`. */
function firstParamValue(entry: unknown): { value: string; label: string } | null {
  const record = asRecord(entry);
  const values = record?.values;
  if (!Array.isArray(values) || values.length === 0) return null;
  const first = asRecord(values[0]);
  const value = asString(first?.value);
  const label = asString(first?.label) ?? value;
  if (value === undefined || label === undefined) return null;
  return { value, label };
}

function normalizeLocation(seller: UnknownRecord | null): NormalizedAdvertLocation {
  const location = asRecord(seller?.location);
  if (!location) return {};
  const canonicals = asRecord(location.canonicals);
  let concelhoSlug = asString(canonicals?.subregion);
  const regionSlug = asString(canonicals?.region);
  // subregion comes suffixed with the district slug ("barcelos-braga").
  if (concelhoSlug && regionSlug && concelhoSlug.endsWith(`-${regionSlug}`)) {
    concelhoSlug = concelhoSlug.slice(0, -(regionSlug.length + 1));
  }
  return {
    city: asString(location.city),
    concelhoSlug,
    region: asString(location.region),
  };
}

export function normalizeStandvirtualAdvert(
  nextData: unknown,
  requestedUrl: string,
): NormalizedAdvert | null {
  const props = asRecord(asRecord(nextData)?.props);
  const pageProps = asRecord(props?.pageProps);
  const advert = asRecord(pageProps?.advert);
  if (!advert) return null;

  const url = asString(advert.url) ?? requestedUrl;
  const adId = extractStandvirtualAdId(url) ?? extractStandvirtualAdId(requestedUrl);
  if (!adId) return null;

  const price = asRecord(advert.price);
  const priceNumber = price ? Number(price.value) : NaN;

  const images = asRecord(advert.images);
  const photos = (Array.isArray(images?.photos) ? images.photos : [])
    .map((photo) => asString(asRecord(photo)?.url))
    .filter((photoUrl): photoUrl is string => photoUrl !== undefined);

  const params: NormalizedAdvert['params'] = {};
  const parametersDict = asRecord(advert.parametersDict);
  for (const [key, entry] of Object.entries(parametersDict ?? {})) {
    const value = firstParamValue(entry);
    if (value) params[key] = value;
  }

  const equipmentKeys: string[] = [];
  for (const group of Array.isArray(advert.equipment) ? advert.equipment : []) {
    const options = asRecord(group)?.values;
    for (const option of Array.isArray(options) ? options : []) {
      const key = asString(asRecord(option)?.key);
      if (key) equipmentKeys.push(key);
    }
  }

  const status = asString(advert.status);

  return {
    adId,
    url,
    title: asString(advert.title) ?? '',
    descriptionHtml: asString(advert.description) ?? '',
    priceValue: Number.isFinite(priceNumber) ? priceNumber : null,
    currency: price ? (asString(price.currency) ?? null) : null,
    photos,
    params,
    equipmentKeys,
    location: normalizeLocation(asRecord(advert.seller)),
    active: status ? status.toUpperCase() === 'ACTIVE' : true,
  };
}
