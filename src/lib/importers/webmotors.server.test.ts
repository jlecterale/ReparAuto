import { fetchAndMapWebmotorsAdvert } from '@/lib/importers/webmotors.server';

const MOCK_HTML = `
  <html>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Car",
      "name": "Chevrolet Corvette Z06",
      "brand": "Chevrolet",
      "model": "Corvette",
      "offers": { "price": "950000", "priceCurrency": "BRL" },
      "vehicleModelDate": "2023",
      "image": ["https://img.webmotors.com/corvette.jpg"]
    }
    </script>
  </html>
`;

describe('fetchAndMapWebmotorsAdvert', () => {
  it('maps and returns details directly from htmlOverride without fetching', async () => {
    const result = await fetchAndMapWebmotorsAdvert(
      'https://www.webmotors.com.br/comprar/chevrolet/corvette/123',
      MOCK_HTML,
    );
    expect(result.outcome).toBe('ok');
    if (result.outcome === 'ok') {
      expect(result.advert.adId).toBe('123');
      expect(result.advert.title).toBe('Chevrolet Corvette Z06');
      expect(result.mapped.dados.marca).toBe('Chevrolet');
      expect(result.mapped.dados.modelo).toBe('Corvette');
      expect(result.mapped.dados.preco).toBe('950000');
    }
  });

  it('returns parse_failed when htmlOverride has invalid data', async () => {
    const result = await fetchAndMapWebmotorsAdvert(
      'https://www.webmotors.com.br/comprar/invalid/123',
      '<html></html>',
    );
    expect(result.outcome).toBe('parse_failed');
  });
});
