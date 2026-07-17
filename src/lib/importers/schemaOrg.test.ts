import { extractSchemaOrgAdvert } from '@/lib/importers/schemaOrg';

const MOCK_HTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Mock Page</title>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Car",
    "name": "Porsche 911 Carrera T",
    "description": "Porsche 911 em ótimo estado",
    "image": [
      "https://images.example.com/porsche1.jpg",
      "https://images.example.com/porsche2.jpg"
    ],
    "brand": {
      "@type": "Brand",
      "name": "Porsche"
    },
    "model": "911",
    "vehicleModelDate": "2024",
    "mileageFromOdometer": {
      "@type": "QuantitativeValue",
      "value": "2500"
    },
    "offers": {
      "@type": "Offer",
      "price": "1450000.00",
      "priceCurrency": "BRL"
    },
    "fuelType": "Gasolina",
    "vehicleTransmission": "Manual"
  }
  </script>
</head>
<body>
  <h1>Porsche 911</h1>
</body>
</html>
`;

describe('extractSchemaOrgAdvert', () => {
  it('extracts car details from valid schema.org JSON-LD', () => {
    const data = extractSchemaOrgAdvert(MOCK_HTML, 'https://example.com/car/1');
    expect(data).not.toBeNull();
    expect(data?.title).toBe('Porsche 911 Carrera T');
    expect(data?.brand).toBe('Porsche');
    expect(data?.model).toBe('911');
    expect(data?.description).toBe('Porsche 911 em ótimo estado');
    expect(data?.year).toBe(2024);
    expect(data?.mileage).toBe(2500);
    expect(data?.price).toEqual({ amount: 1450000, currency: 'BRL' });
    expect(data?.fuelType).toBe('Gasolina');
    expect(data?.transmission).toBe('Manual');
    expect(data?.photos).toHaveLength(2);
    expect(data?.photos?.[0]).toBe('https://images.example.com/porsche1.jpg');
    expect(data?.photos?.[1]).toBe('https://images.example.com/porsche2.jpg');
  });

  it('returns null when no matching schema type is found', () => {
    const badHtml = `
      <html>
        <script type="application/ld+json">
          { "@context": "https://schema.org", "@type": "Book", "name": "Harry Potter" }
        </script>
      </html>
    `;
    expect(extractSchemaOrgAdvert(badHtml, 'https://example.com/book/1')).toBeNull();
  });
});
