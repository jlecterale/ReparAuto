// Cookie-consent model and its mapping to Google Consent Mode v2 signals.
// Kept as a pure module (no `window`/gtag access) so the mapping is unit-tested;
// the thin gtag side effect lives in the banner component.

export interface CookieConsent {
  necessarios: boolean;
  funcionais: boolean;
  analiticos: boolean;
  marketing: boolean;
}

export const CONSENT_STORAGE_KEY = 'reparauto_cookie_consent';

export type ConsentState = 'granted' | 'denied';

/** The Google Consent Mode v2 signals we control from the banner. */
export interface GtagConsentUpdate {
  ad_storage: ConsentState;
  ad_user_data: ConsentState;
  ad_personalization: ConsentState;
  analytics_storage: ConsentState;
}

const state = (granted: boolean): ConsentState => (granted ? 'granted' : 'denied');

/**
 * Map the user's banner choices to gtag consent signals. Marketing consent drives
 * all three ad_* signals (Google Ads conversion + remarketing); the analytics
 * toggle drives analytics_storage. Everything defaults to denied (opt-in / RGPD).
 */
export function toGtagConsent(consent: Pick<CookieConsent, 'analiticos' | 'marketing'>): GtagConsentUpdate {
  const marketing = state(consent.marketing);
  return {
    ad_storage: marketing,
    ad_user_data: marketing,
    ad_personalization: marketing,
    analytics_storage: state(consent.analiticos),
  };
}

/**
 * Safely parse the consent value read from localStorage. Returns null when nothing
 * is stored or the payload is malformed (caller should then show the banner).
 * Missing keys coerce to false so legacy consents (saved before the marketing
 * category existed) never silently grant a category the user never saw.
 */
export function parseConsent(raw: string | null): CookieConsent | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<CookieConsent>;
    return {
      necessarios: !!parsed.necessarios,
      funcionais: !!parsed.funcionais,
      analiticos: !!parsed.analiticos,
      marketing: !!parsed.marketing,
    };
  } catch {
    return null;
  }
}
