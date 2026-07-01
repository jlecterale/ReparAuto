// Multi-country model — mirrors the web `src/lib/country.ts` (plan 20, Brazil
// expansion). Pure module: no AsyncStorage access here; the async persistence
// side effects live in CountryContext, which keeps the module-level active
// country below in sync so non-React code can read it synchronously.

export type Country = 'PT' | 'BR';

export const DEFAULT_COUNTRY: Country = 'PT';

export const COUNTRIES: Country[] = ['PT', 'BR'];

// Follows the historical `*_reparauto` storage key convention (web parity).
export const COUNTRY_STORAGE_KEY = 'country_reparauto';

export interface CountryInfo {
  code: Country;
  nome: string;
  flag: string;
  currency: 'EUR' | 'BRL';
  locale: 'pt-PT' | 'pt-BR';
  /** International dialing prefix used to build WhatsApp links. */
  phonePrefix: string;
}

export const COUNTRY_INFO: Record<Country, CountryInfo> = {
  PT: { code: 'PT', nome: 'Portugal', flag: '🇵🇹', currency: 'EUR', locale: 'pt-PT', phonePrefix: '351' },
  BR: { code: 'BR', nome: 'Brasil', flag: '🇧🇷', currency: 'BRL', locale: 'pt-BR', phonePrefix: '55' },
};

/**
 * Resolve the country of a Firestore document. Docs created before the Brazil
 * launch carry no `country` field — they are Portuguese by definition, so
 * anything missing or unrecognized resolves to PT.
 */
export function docCountry(doc: { country?: string | null }): Country {
  return doc.country === 'BR' ? 'BR' : 'PT';
}

/**
 * Safely parse a country preference read from storage (AsyncStorage here).
 * Returns null when nothing is stored or the payload is malformed, so the
 * caller can fall back to GeoIP detection or DEFAULT_COUNTRY.
 */
export function parseCountry(raw: string | null): Country | null {
  return raw === 'PT' || raw === 'BR' ? raw : null;
}

// AsyncStorage is async, so — unlike the web, which reads localStorage on
// demand — the active market lives in this module-level variable that
// CountryContext keeps in sync. Creation code (db.ts / trust.ts) reads it
// synchronously via getActiveCountry().
let activeCountry: Country = DEFAULT_COUNTRY;

export function setActiveCountry(country: Country): void {
  activeCountry = country;
}

/** The active market as maintained by CountryContext (defaults to PT). */
export function getActiveCountry(): Country {
  return activeCountry;
}
