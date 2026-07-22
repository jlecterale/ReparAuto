import type { Country } from '@/lib/country';

/**
 * Resolves the wa.me-ready number for a listing: prefers the explicit WhatsApp
 * field, falls back to the phone, and prepends the market's dialing code when
 * missing — sellers type local numbers ("912345678", "11987654321"), which
 * wa.me rejects without the prefix. Extends the web `obterWhatsApp` in
 * `src/lib/utils.ts` by also normalizing the explicit WhatsApp field (the web
 * returns it as-is). Returns null when no usable number is available (the
 * WhatsApp button should then be hidden).
 */
export function resolveWhatsAppNumber(
  whatsapp: string | null | undefined,
  telefone: string | null | undefined,
  country: Country,
): string | null {
  const normalize = (raw: string): string | null => {
    const digits = raw.replace(/[\s().+-]/g, '');
    if (country === 'BR') {
      // Only mobiles (DDD + 9xxxxxxxx) receive WhatsApp links.
      if (/^[1-9][0-9]9\d{8}$/.test(digits)) return '55' + digits;
      if (/^55[1-9][0-9]9\d{8}$/.test(digits)) return digits;
    } else {
      if (/^9\d{8}$/.test(digits)) return '351' + digits;
      if (/^3519\d{8}$/.test(digits)) return digits;
    }
    return null;
  };
  if (whatsapp?.trim()) {
    const digits = whatsapp.replace(/[\s().+-]/g, '');
    // Not in the market's local format but long enough to already carry a
    // dialing code (e.g. a foreign number) — pass it through like the web does.
    return normalize(whatsapp) ?? (/^\d{10,15}$/.test(digits) ? digits : null);
  }
  return telefone?.trim() ? normalize(telefone) : null;
}

export function whatsAppUrl(numero: string): string {
  return `https://wa.me/${numero}`;
}
