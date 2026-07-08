import {
  MAX_IMPORT_BATCH_SIZE,
  buildUrlBatch,
  extractStandvirtualAdId,
  extractUrlsFromText,
  validateStandvirtualUrl,
} from '@/lib/importers/urlList';

const AD_URL = 'https://www.standvirtual.com/carros/anuncio/citroen-c4-cactus-ver-puretech-110-stop-start-eat6-shine-ID8Q0B0W.html';

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

  it('keeps non-URL tokens that mention standvirtual so they can be flagged invalid later', () => {
    expect(extractUrlsFromText('standvirtual.com/carros/anuncio/x-ID9.html')).toEqual([
      'standvirtual.com/carros/anuncio/x-ID9.html',
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
    ]);
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
    ]);
    expect(batch.map((i) => i.adId)).toEqual(['2', '1']);
  });

  it('exposes the batch cap for the UI', () => {
    expect(MAX_IMPORT_BATCH_SIZE).toBe(25);
  });
});
