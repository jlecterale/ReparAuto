import { isAllowedPhotoUrl } from '@/lib/importers/photoUrl';

describe('isAllowedPhotoUrl', () => {
  it('accepts Standvirtual photos on the OLX CDN', () => {
    expect(
      isAllowedPhotoUrl('https://ireland.apollo.olxcdn.com/v1/files/abc123/image'),
    ).toBe(true);
    expect(isAllowedPhotoUrl('https://apollo.olxcdn.com/v1/files/abc/image;s=1080x720')).toBe(true);
  });
 
  it('accepts Webmotors photos on the Webmotors CDN', () => {
    expect(
      isAllowedPhotoUrl('https://img1.webmotors.com.br/fotos/anuncio/abc123_1.jpg'),
    ).toBe(true);
    expect(
      isAllowedPhotoUrl('https://webmotors.com.br/fotos/anuncio/abc123_2.png'),
    ).toBe(true);
  });

  it('rejects plain http', () => {
    expect(isAllowedPhotoUrl('http://ireland.apollo.olxcdn.com/v1/files/abc/image')).toBe(false);
  });

  it('rejects other hosts and lookalikes (SSRF guard)', () => {
    expect(isAllowedPhotoUrl('https://example.com/foto.jpg')).toBe(false);
    expect(isAllowedPhotoUrl('https://olxcdn.com.evil.example/x/image')).toBe(false);
    expect(isAllowedPhotoUrl('https://evilolxcdn.com/x/image')).toBe(false);
    expect(isAllowedPhotoUrl('https://169.254.169.254/latest/meta-data')).toBe(false);
  });

  it('rejects explicit ports and malformed URLs', () => {
    expect(isAllowedPhotoUrl('https://apollo.olxcdn.com:8443/x/image')).toBe(false);
    expect(isAllowedPhotoUrl('not-a-url')).toBe(false);
  });
});
