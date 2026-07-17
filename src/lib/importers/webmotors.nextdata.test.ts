import { normalizeWebmotorsAdvert } from '@/lib/importers/webmotors.nextdata';

const MOCK_WEBMOTORS_HTML = `
<!DOCTYPE html>
<html>
<head>
  <script id="__NEXT_DATA__" type="application/json">
  {
    "props": {
      "pageProps": {
        "advert": {
          "make": { "name": "Porsche" },
          "model": { "name": "911" },
          "version": { "name": "3.0 24v Carrera T" },
          "yearModel": 2024,
          "price": 1450000,
          "odometer": 2500,
          "fuel": "Gasolina",
          "transmission": "Manual",
          "color": "Branco",
          "description": "Excelente estado de conservação.",
          "photos": [
            { "url": "https://img.webmotors.com/1.jpg" },
            { "url": "https://img.webmotors.com/2.jpg" }
          ]
        }
      }
    }
  }
  </script>
</head>
<body>
</body>
</html>
`;

describe('normalizeWebmotorsAdvert', () => {
  it('parses next data structure and extracts normalized car details', () => {
    const data = normalizeWebmotorsAdvert(
      MOCK_WEBMOTORS_HTML,
      'https://www.webmotors.com.br/comprar/porsche/911/30-24v-h6-gasolina-carrera-t-cabriolet-manual/2',
    );
    expect(data).not.toBeNull();
    expect(data?.adId).toBe('2');
    expect(data?.title).toBe('Porsche 911 3.0 24v Carrera T');
    expect(data?.priceValue).toBe(1450000);
    expect(data?.currency).toBe('BRL');
    expect(data?.photos).toEqual([
      'https://img.webmotors.com/1.jpg',
      'https://img.webmotors.com/2.jpg',
    ]);
    expect(data?.params['marca']?.label).toBe('Porsche');
    expect(data?.params['modelo']?.label).toBe('911');
    expect(data?.params['cambio']?.label).toBe('Manual');
    expect(data?.params['cor']?.label).toBe('Branco');
    expect(data?.descriptionHtml).toBe('Excelente estado de conservação.');
  });

  it('falls back to schema.org vehicle parser when next data is missing', () => {
    const schemaHtml = `
      <html>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Car",
          "name": "Chevrolet Onix 1.0",
          "brand": "Chevrolet",
          "model": "Onix",
          "offers": { "price": "65000", "priceCurrency": "BRL" },
          "vehicleModelDate": "2022",
          "image": ["https://img.webmotors.com/onix.jpg"]
        }
        </script>
      </html>
    `;
    const data = normalizeWebmotorsAdvert(schemaHtml, 'https://www.webmotors.com.br/comprar/onix/123');
    expect(data).not.toBeNull();
    expect(data?.adId).toBe('123');
    expect(data?.title).toBe('Chevrolet Onix 1.0');
    expect(data?.priceValue).toBe(65000);
    expect(data?.photos).toEqual(['https://img.webmotors.com/onix.jpg']);
  });

  it('returns null when no data can be extracted', () => {
    expect(normalizeWebmotorsAdvert('<html></html>', 'https://www.webmotors.com.br/comprar/123')).toBeNull();
  });
});
