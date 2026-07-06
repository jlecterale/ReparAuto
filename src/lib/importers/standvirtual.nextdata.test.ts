import { readFileSync } from 'fs';
import { join } from 'path';
import {
  extractNextData,
  isBlockedHtml,
  normalizeStandvirtualAdvert,
} from '@/lib/importers/standvirtual.nextdata';

// Real advert object captured from a live Standvirtual page (trimmed).
const advertFixture = JSON.parse(
  readFileSync(join(__dirname, '__fixtures__', 'standvirtual-advert.json'), 'utf-8'),
);

function advertPageHtml(advert: unknown): string {
  const nextData = { props: { pageProps: { advert } } };
  // Real ad pages also embed the DataDome JS tag — the block detector must
  // not trip on it when the page content is actually there.
  return `<!DOCTYPE html><html><head><script src="https://js.datadome.co/tags.js"></script></head><body><div id="__next"></div><script id="__NEXT_DATA__" type="application/json">${JSON.stringify(nextData)}</script></body></html>`;
}

// Shape of the DataDome challenge interstitial served instead of the ad.
const BLOCKED_HTML = `<html><head><title>standvirtual.com</title></head><body><script>var dd={'rt':'c','cid':'x','hsh':'y','t':'fe','s':123,'host':'geo.captcha-delivery.com'}</script><script src="https://ct.captcha-delivery.com/c.js"></script></body></html>`;

describe('extractNextData', () => {
  it('parses the __NEXT_DATA__ JSON blob out of the page HTML', () => {
    const data = extractNextData(advertPageHtml(advertFixture)) as {
      props: { pageProps: { advert: { id: string } } };
    };
    expect(data.props.pageProps.advert.id).toBe(advertFixture.id);
  });

  it('returns null when the script tag is missing or corrupt', () => {
    expect(extractNextData('<html><body>nada</body></html>')).toBeNull();
    expect(
      extractNextData('<script id="__NEXT_DATA__" type="application/json">{broken</script>'),
    ).toBeNull();
  });
});

describe('isBlockedHtml', () => {
  it('detects the DataDome challenge interstitial', () => {
    expect(isBlockedHtml(BLOCKED_HTML)).toBe(true);
  });

  it('does not flag a real advert page that merely loads the DataDome tag', () => {
    expect(isBlockedHtml(advertPageHtml(advertFixture))).toBe(false);
  });

  it('does not flag an ordinary page without challenge markers', () => {
    expect(isBlockedHtml('<html><body>404</body></html>')).toBe(false);
  });
});

describe('normalizeStandvirtualAdvert', () => {
  const nextData = { props: { pageProps: { advert: advertFixture } } };

  it('normalizes the real advert into the intermediate import shape', () => {
    const advert = normalizeStandvirtualAdvert(nextData, 'https://www.standvirtual.com/x-ID000.html');
    expect(advert).not.toBeNull();
    expect(advert!.adId).toBe('8Q0B0W'); // from the canonical advert.url, not the requested one
    expect(advert!.title).toContain('C4 Cactus');
    expect(advert!.priceValue).toBe(10890);
    expect(advert!.currency).toBe('EUR');
    expect(advert!.photos).toHaveLength(4);
    expect(advert!.photos[0]).toMatch(/^https:\/\/ireland\.apollo\.olxcdn\.com\//);
    expect(advert!.descriptionHtml).toMatch(/^<p>/);
    expect(advert!.active).toBe(true);
  });

  it('flattens parametersDict into value/label pairs', () => {
    const advert = normalizeStandvirtualAdvert(nextData, advertFixture.url)!;
    expect(advert.params.fuel_type).toEqual({ value: 'gaz', label: 'Gasolina' });
    expect(advert.params.gearbox).toEqual({ value: 'automatic', label: 'Automática' });
    expect(advert.params.mileage.value).toBe('73365');
    expect(advert.params.make.label).toBe('Citroën');
  });

  it('collects equipment keys', () => {
    const advert = normalizeStandvirtualAdvert(nextData, advertFixture.url)!;
    expect(advert.equipmentKeys).toContain('bluetooth_interface');
    expect(advert.equipmentKeys).toContain('navigation_system');
  });

  it('extracts the seller location with the concelho slug', () => {
    const advert = normalizeStandvirtualAdvert(nextData, advertFixture.url)!;
    expect(advert.location.region).toBe('Braga');
    expect(advert.location.concelhoSlug).toBe('barcelos');
  });

  it('falls back to the requested URL for the ad id when the blob has none', () => {
    const noUrl = { ...advertFixture, url: undefined };
    const advert = normalizeStandvirtualAdvert(
      { props: { pageProps: { advert: noUrl } } },
      'https://www.standvirtual.com/carros/anuncio/x-ID8Q0B0W.html',
    );
    expect(advert!.adId).toBe('8Q0B0W');
  });

  it('tolerates a minimal advert without optional blocks', () => {
    const advert = normalizeStandvirtualAdvert(
      { props: { pageProps: { advert: { id: '1', title: 'Carro', url: advertFixture.url } } } },
      advertFixture.url,
    );
    expect(advert).not.toBeNull();
    expect(advert!.photos).toEqual([]);
    expect(advert!.params).toEqual({});
    expect(advert!.equipmentKeys).toEqual([]);
    expect(advert!.priceValue).toBeNull();
  });

  it('returns null when there is no advert in the blob', () => {
    expect(normalizeStandvirtualAdvert({ props: { pageProps: {} } }, 'x')).toBeNull();
    expect(normalizeStandvirtualAdvert(null, 'x')).toBeNull();
  });
});
