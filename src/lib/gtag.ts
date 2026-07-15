// Google Ads (gtag.js) tag id and conversion-tracking helpers.

export const GOOGLE_ADS_ID = 'AW-786052925';

/**
 * Conversion action labels from Google Ads (Objetivos → Conversões → +Nova).
 * Each action created in the panel yields a "AW-<id>/<label>" send_to value.
 * Replace the REPLACE_* placeholders with the real labels; until then
 * reportConversion() no-ops for that action so no bogus conversions are sent.
 */
export const CONVERSION_LABELS = {
  contactSeller: 'AW-786052925/xuVuCPS5k8kcEL3u6PYC',
  signUp: 'AW-786052925/oVUJCMS8k8kcEL3u6PYC',
} as const;

type GtagFn = (...args: unknown[]) => void;

/**
 * Return the gtag function, falling back to a dataLayer shim so events are queued
 * and processed once gtag.js loads (a click can beat the afterInteractive script).
 */
export function getGtag(): GtagFn {
  const w = window as unknown as { dataLayer?: unknown[]; gtag?: GtagFn };
  w.dataLayer = w.dataLayer || [];
  if (!w.gtag) {
    w.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      w.dataLayer!.push(arguments);
    };
  }
  return w.gtag;
}

export interface ConversionParams {
  value?: number;
  currency?: string;
}

/**
 * Fire a Google Ads conversion event. Safe no-op during SSR or when the send_to
 * label has not been configured yet (still a REPLACE_* placeholder or empty).
 */
export function reportConversion(sendTo: string, params: ConversionParams = {}): void {
  if (typeof window === 'undefined') return;
  if (!sendTo || sendTo.includes('REPLACE_')) return;
  getGtag()('event', 'conversion', { send_to: sendTo, ...params });
}
