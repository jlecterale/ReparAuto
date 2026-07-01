import { parseConsent, toGtagConsent, type CookieConsent } from '@/lib/consent';

// Google Consent Mode v2: the cookie banner choices must map to the four gtag
// consent signals. Marketing drives the ad_* signals; the analytics toggle drives
// analytics_storage. Anything not explicitly granted stays denied (opt-in, RGPD).

describe('toGtagConsent', () => {
  it('grants ad signals only when marketing is accepted', () => {
    expect(toGtagConsent({ analiticos: false, marketing: true })).toEqual({
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      analytics_storage: 'denied',
    });
  });

  it('grants analytics_storage only when analytics is accepted', () => {
    expect(toGtagConsent({ analiticos: true, marketing: false })).toEqual({
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'granted',
    });
  });

  it('denies everything when both are refused', () => {
    expect(toGtagConsent({ analiticos: false, marketing: false })).toEqual({
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
    });
  });
});

describe('parseConsent', () => {
  it('returns null when no consent has been stored yet', () => {
    expect(parseConsent(null)).toBeNull();
  });

  it('returns null for malformed JSON', () => {
    expect(parseConsent('{not json')).toBeNull();
  });

  it('parses a stored consent object, coercing missing keys to false', () => {
    const stored = JSON.stringify({ necessarios: true, marketing: true });
    expect(parseConsent(stored)).toEqual<CookieConsent>({
      necessarios: true,
      funcionais: false,
      analiticos: false,
      marketing: true,
    });
  });

  it('back-fills marketing as false for legacy consent saved before the category existed', () => {
    const legacy = JSON.stringify({ necessarios: true, funcionais: true, analiticos: true });
    expect(parseConsent(legacy)?.marketing).toBe(false);
  });
});
