// Multi-country model (plan 20 — Brazil expansion). Pure module: no
// `window`/localStorage access here so the resolution rules are unit-tested;
// the thin browser side effects live in the CountryProvider.

export type Country = 'PT' | 'BR';

export const DEFAULT_COUNTRY: Country = 'PT';

export const COUNTRIES: Country[] = ['PT', 'BR'];

// Follows the historical `*_reparauto` localStorage key convention.
export const COUNTRY_STORAGE_KEY = 'country_reparauto';

export interface CountryInfo {
  code: Country;
  name: string;
  flag: string;
  currency: 'EUR' | 'BRL';
  locale: 'pt-PT' | 'pt-BR';
  /** International dialing prefix used to build WhatsApp links. */
  phonePrefix: string;
}

export const COUNTRY_INFO: Record<Country, CountryInfo> = {
  PT: { code: 'PT', name: 'Portugal', flag: '🇵🇹', currency: 'EUR', locale: 'pt-PT', phonePrefix: '351' },
  BR: { code: 'BR', name: 'Brasil', flag: '🇧🇷', currency: 'BRL', locale: 'pt-BR', phonePrefix: '55' },
};

/**
 * Resolve the country of a Firestore document. Docs created before the Brazil
 * launch carry no `country` field — they are Portuguese by definition, so
 * anything missing or unrecognized resolves to PT.
 */
export function docCountry(doc: { country?: string | null }): Country {
  return doc.country === 'BR' ? 'BR' : 'PT';
}

/** Market isolation: keep only the docs that belong to the given market. */
export function filterByCountry<T extends { country?: string | null }>(items: T[], country: Country): T[] {
  return items.filter((item) => docCountry(item) === country);
}

/**
 * Safely parse a country preference read from storage (localStorage on web).
 * Returns null when nothing is stored or the payload is malformed, so the
 * caller can fall back to GeoIP detection or DEFAULT_COUNTRY.
 */
export function parseCountry(raw: string | null): Country | null {
  return raw === 'PT' || raw === 'BR' ? raw : null;
}

/**
 * Boundary helper for non-React code (db.ts create functions): the active
 * market as persisted by CountryProvider. Server-side it is always the
 * default — SSR never creates listings.
 */
export function getActiveCountry(): Country {
  if (typeof window === 'undefined') return DEFAULT_COUNTRY;
  try {
    return parseCountry(window.localStorage.getItem(COUNTRY_STORAGE_KEY)) ?? DEFAULT_COUNTRY;
  } catch {
    return DEFAULT_COUNTRY;
  }
}
