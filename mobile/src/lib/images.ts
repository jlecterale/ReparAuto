/**
 * Normalizes an image URL pasted by the user (listing photos can be added by
 * URL): trims, defaults the scheme to https, upgrades http and rejects anything
 * that is not a plain https web address. Returns null for invalid input.
 * Mirrors the web `parseExternalImageUrl` in `src/lib/utils.ts`.
 */
export function parseExternalImageUrl(input: string | null | undefined): string | null {
  if (!input) return null;
  let value = input.trim();
  if (!value) return null;
  if (/^http:\/\//i.test(value)) {
    value = 'https://' + value.slice('http://'.length);
  } else if (!/^https:\/\//i.test(value)) {
    // Any other explicit scheme (javascript:, data:, blob:, ftp:, …) is rejected.
    if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return null;
    value = 'https://' + value;
  }
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !url.hostname.includes('.')) return null;
    return url.toString();
  } catch {
    return null;
  }
}
