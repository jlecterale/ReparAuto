import { readFileSync } from 'fs';
import { join } from 'path';
import {
  extractAdvertUrlsFromHtml,
  normalizeInventoryPage,
} from '@/lib/importers/standvirtual.nextdata';
import { validateStandvirtualInventoryUrl } from '@/lib/importers/urlList';

// Real dealer /inventory page __NEXT_DATA__ (trimmed) — publishedAds lives in
// the urql GraphQL cache, string-encoded inside each state entry.
const inventoryFixture = JSON.parse(
  readFileSync(join(__dirname, '__fixtures__', 'standvirtual-inventory.json'), 'utf-8'),
);

describe('validateStandvirtualInventoryUrl', () => {
  it('accepts a dealer inventory URL and normalizes it', () => {
    const parsed = validateStandvirtualInventoryUrl('https://nicolacar.standvirtual.com/inventory');
    expect(parsed.valid).toBe(true);
    expect(parsed.standSlug).toBe('nicolacar');
    expect(parsed.normalizedUrl).toBe('https://nicolacar.standvirtual.com/inventory');
  });

  it('accepts the stand homepage and protocol-less input, normalizing to /inventory', () => {
    for (const input of [
      'https://nicolacar.standvirtual.com',
      'nicolacar.standvirtual.com/inventory?page=2',
      'http://nicolacar.standvirtual.com/about',
    ]) {
      const parsed = validateStandvirtualInventoryUrl(input);
      expect(parsed.valid).toBe(true);
      expect(parsed.normalizedUrl).toBe('https://nicolacar.standvirtual.com/inventory');
    }
  });

  it('rejects the marketplace host and lookalikes', () => {
    for (const input of [
      'https://www.standvirtual.com/carros',
      'https://standvirtual.com',
      'https://nicolacar.standvirtual.com.evil.example/inventory',
      'https://nicolacar-standvirtual.com/inventory',
      'https://a.b.standvirtual.com/inventory',
      'not a url',
      '',
    ]) {
      const parsed = validateStandvirtualInventoryUrl(input);
      expect(parsed.valid).toBe(false);
      expect(parsed.reason).toBeTruthy();
    }
  });
});

describe('normalizeInventoryPage', () => {
  it('reads the ad URLs, total and page size from the urql cache', () => {
    const page = normalizeInventoryPage(inventoryFixture);
    expect(page).not.toBeNull();
    expect(page!.adUrls).toHaveLength(3);
    expect(page!.adUrls[0]).toMatch(/^https:\/\/www\.standvirtual\.com\/carros\/anuncio\/.+-ID[A-Za-z0-9]+\.html$/);
    expect(page!.total).toBe(34);
    expect(page!.pageSize).toBe(30);
  });

  it('returns null when there is no publishedAds cache entry', () => {
    expect(normalizeInventoryPage({ props: { pageProps: { urqlState: {} } } })).toBeNull();
    expect(normalizeInventoryPage({ props: { pageProps: {} } })).toBeNull();
    expect(normalizeInventoryPage(null)).toBeNull();
  });

  it('tolerates a corrupt cache entry alongside a good one', () => {
    const fixture = JSON.parse(JSON.stringify(inventoryFixture));
    fixture.props.pageProps.urqlState.broken = { data: '{not json' };
    expect(normalizeInventoryPage(fixture)!.total).toBe(34);
  });
});

describe('extractAdvertUrlsFromHtml', () => {
  it('finds advert URLs anywhere in the raw HTML (fallback path)', () => {
    const html =
      '<a href="https://www.standvirtual.com/carros/anuncio/bmw-z4-ID8Q0uCV.html">x</a>' +
      '"https://www.standvirtual.com/carros/anuncio/ford-focus-ID8Q0m7m.html"' +
      '<a href="https://www.standvirtual.com/carros/anuncio/bmw-z4-ID8Q0uCV.html">dup</a>';
    expect(extractAdvertUrlsFromHtml(html)).toEqual([
      'https://www.standvirtual.com/carros/anuncio/bmw-z4-ID8Q0uCV.html',
      'https://www.standvirtual.com/carros/anuncio/ford-focus-ID8Q0m7m.html',
    ]);
  });

  it('returns an empty list when nothing matches', () => {
    expect(extractAdvertUrlsFromHtml('<html>vazio</html>')).toEqual([]);
  });
});
