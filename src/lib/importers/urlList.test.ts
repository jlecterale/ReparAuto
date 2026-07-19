import {
  MAX_IMPORT_BATCH_SIZE,
  buildUrlBatch,
  extractStandvirtualAdId,
  extractUrlsFromText,
  validateStandvirtualUrl,
  validateWebmotorsUrl,
  validateImportUrl,
} from '@/lib/importers/urlList';

const AD_URL = 'https://www.standvirtual.com/carros/anuncio/citroen-c4-cactus-ver-puretech-110-stop-start-eat6-shine-ID8Q0B0W.html';
const WEBMOTORS_URL = 'https://www.webmotors.com.br/comprar/porsche/911/30-24v-h6-gasolina-carrera-t-cabriolet-manual/2';

describe('extractStandvirtualAdId', () => {
  it('extracts the ID token from an advert URL', () => {
    expect(extractStandvirtualAdId(AD_URL)).toBe('8Q0B0W');
  });

  it('returns null when the URL has no ID token', () => {
    expect(extractStandvirtualAdId('https://www.standvirtual.com/carros')).toBeNull();
  });
});

describe('validateStandvirtualUrl', () => {
  it('accepts a canonical advert URL', () => {
    const parsed = validateStandvirtualUrl(AD_URL);
    expect(parsed.valid).toBe(true);
    expect(parsed.adId).toBe('8Q0B0W');
    expect(parsed.normalizedUrl).toBe(AD_URL);
  });

  it('normalizes host, protocol, query string and hash', () => {
    const parsed = validateStandvirtualUrl(
      'http://standvirtual.com/carros/anuncio/bmw-z4-ver-2-0i-ID8Q0uCV.html?utm_source=share#top',
    );
    expect(parsed.valid).toBe(true);
    expect(parsed.normalizedUrl).toBe(
      'https://www.standvirtual.com/carros/anuncio/bmw-z4-ver-2-0i-ID8Q0uCV.html',
    );
  });

  it('accepts a protocol-less URL', () => {
    const parsed = validateStandvirtualUrl('www.standvirtual.com/carros/anuncio/ford-focus-ID8Q0m7m.html');
    expect(parsed.valid).toBe(true);
    expect(parsed.adId).toBe('8Q0m7m');
  });

  it('rejects other hosts, including lookalikes', () => {
    for (const url of [
      'https://www.olx.pt/carros/anuncio/ford-focus-ID8Q0m7m.html',
      'https://standvirtual.com.evil.example/carros/anuncio/ford-focus-ID8Q0m7m.html',
      'https://evil-standvirtual.com/carros/anuncio/ford-focus-ID8Q0m7m.html',
    ]) {
      const parsed = validateStandvirtualUrl(url);
      expect(parsed.valid).toBe(false);
      expect(parsed.reason).toBeTruthy();
    }
  });

  it('rejects Standvirtual URLs that are not advert pages', () => {
    const parsed = validateStandvirtualUrl('https://www.standvirtual.com/carros/bmw');
    expect(parsed.valid).toBe(false);
    expect(parsed.reason).toBeTruthy();
  });

  it('rejects garbage input', () => {
    expect(validateStandvirtualUrl('not a url').valid).toBe(false);
    expect(validateStandvirtualUrl('').valid).toBe(false);
  });
});

describe('validateWebmotorsUrl', () => {
  it('accepts a valid Webmotors URL', () => {
    const parsed = validateWebmotorsUrl(WEBMOTORS_URL);
    expect(parsed.valid).toBe(true);
    expect(parsed.adId).toBe('2');
    expect(parsed.normalizedUrl).toBe(WEBMOTORS_URL);
  });

  it('rejects Webmotors URLs that are not listing pages', () => {
    const parsed = validateWebmotorsUrl('https://www.webmotors.com.br/carros');
    expect(parsed.valid).toBe(false);
    expect(parsed.reason).toBeTruthy();
  });

  it('rejects Webmotors URLs without a numeric ID', () => {
    const parsed = validateWebmotorsUrl('https://www.webmotors.com.br/comprar/porsche/911/30-24v-h6-gasolina-carrera-t-cabriolet-manual/');
    expect(parsed.valid).toBe(false);
    expect(parsed.reason).toContain('ID numérico');
  });

  it('rejects lookalike hosts', () => {
    const parsed = validateWebmotorsUrl('https://evil-webmotors.com.br/comprar/carro/123');
    expect(parsed.valid).toBe(false);
  });
});

describe('validateImportUrl', () => {
  it('routes validation by country', () => {
    expect(validateImportUrl(AD_URL, 'PT').valid).toBe(true);
    expect(validateImportUrl(AD_URL, 'BR').valid).toBe(false);
    expect(validateImportUrl(WEBMOTORS_URL, 'BR').valid).toBe(true);
    expect(validateImportUrl(WEBMOTORS_URL, 'PT').valid).toBe(false);
  });
});

describe('extractUrlsFromText', () => {
  it('splits URLs separated by newlines, commas and spaces', () => {
    const text = `${AD_URL}\nhttps://www.standvirtual.com/carros/anuncio/a-ID1.html, https://www.standvirtual.com/carros/anuncio/b-ID2.html https://www.standvirtual.com/carros/anuncio/c-ID3.html`;
    expect(extractUrlsFromText(text)).toHaveLength(4);
  });

  it('pulls advert URLs out of CSV content, ignoring headers and other columns', () => {
    const csv = [
      'url,notes',
      `${AD_URL},"my car"`,
      '',
      'https://www.standvirtual.com/carros/anuncio/ford-focus-ID8Q0m7m.html,other',
    ].join('\n');
    expect(extractUrlsFromText(csv)).toEqual([
      AD_URL,
      'https://www.standvirtual.com/carros/anuncio/ford-focus-ID8Q0m7m.html',
    ]);
  });

  it('keeps non-URL tokens that mention standvirtual/webmotors so they can be flagged invalid later', () => {
    expect(extractUrlsFromText('standvirtual.com/carros/anuncio/x-ID9.html')).toEqual([
      'standvirtual.com/carros/anuncio/x-ID9.html',
    ]);
    expect(extractUrlsFromText('webmotors.com.br/comprar/x/y/123')).toEqual([
      'webmotors.com.br/comprar/x/y/123',
    ]);
  });

  it('returns an empty list for blank input', () => {
    expect(extractUrlsFromText('  \n\n ')).toEqual([]);
  });
});

describe('buildUrlBatch', () => {
  it('validates every entry and deduplicates by advert id', () => {
    const batch = buildUrlBatch([
      AD_URL,
      `${AD_URL}?utm_source=copy`,
      'http://standvirtual.com/carros/anuncio/citroen-c4-cactus-ver-puretech-110-stop-start-eat6-shine-ID8Q0B0W.html',
      'https://www.standvirtual.com/carros/anuncio/ford-focus-ID8Q0m7m.html',
      'https://www.olx.pt/anuncio/x-ID1.html',
    ], 'PT');
    expect(batch).toHaveLength(3);
    expect(batch[0].valid).toBe(true);
    expect(batch[0].adId).toBe('8Q0B0W');
    expect(batch[1].adId).toBe('8Q0m7m');
    expect(batch[2].valid).toBe(false);
  });

  it('keeps input order', () => {
    const batch = buildUrlBatch([
      'https://www.standvirtual.com/carros/anuncio/b-ID2.html',
      'https://www.standvirtual.com/carros/anuncio/a-ID1.html',
    ], 'PT');
    expect(batch.map((i) => i.adId)).toEqual(['2', '1']);
  });

  it('exposes the batch cap for the UI', () => {
    expect(MAX_IMPORT_BATCH_SIZE).toBe(25);
  });
});
