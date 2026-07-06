/**
 * SSRF guard for advert photo downloads: the import route only ever fetches
 * images from the OLX CDN that serves Standvirtual photos, over https, on the
 * default port. Pure so it can be unit-tested; photos.ts (server-only) uses it
 * before every download.
 */
export function isAllowedPhotoUrl(input: string): boolean {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:' || url.port !== '') return false;
  const host = url.hostname.toLowerCase();
  return host === 'olxcdn.com' || host.endsWith('.olxcdn.com');
}
