// Helper to recursively find a schema type (e.g. 'Car', 'Vehicle', 'Product') inside a JSON-LD payload.
function findSchemaObject(obj: any, targetTypes: Set<string>): any {
  if (!obj || typeof obj !== 'object') return null;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = findSchemaObject(item, targetTypes);
      if (found) return found;
    }
    return null;
  }

  const type = obj['@type'];
  if (typeof type === 'string' && targetTypes.has(type.toLowerCase())) {
    return obj;
  }

  // If it's a @graph
  if (Array.isArray(obj['@graph'])) {
    return findSchemaObject(obj['@graph'], targetTypes);
  }

  // Check nested fields
  for (const key of Object.keys(obj)) {
    const found = findSchemaObject(obj[key], targetTypes);
    if (found) return found;
  }

  return null;
}

function parseNumber(val: any): number | undefined {
  if (val === null || val === undefined) return undefined;
  const num = Number(String(val).replace(/[^\d.,]/g, '').replace(',', '.'));
  return isNaN(num) ? undefined : num;
}

export interface ExtractedSchemaOrg {
  title?: string;
  brand?: string;
  model?: string;
  description?: string;
  year?: number;
  mileage?: number;
  price?: { amount: number; currency: string };
  fuelType?: string;
  transmission?: string;
  bodyType?: string;
  color?: string;
  photos: string[];
}

/**
 * Extracts and normalizes vehicle/product data from the page's schema.org JSON-LD tags.
 * High compatibility fallback for portals that don't have dedicated parsers.
 */
export function extractSchemaOrgAdvert(html: string, url: string): ExtractedSchemaOrg | null {
  const jsonLdRegex = /<script\s+(?:[^>]*?\s+)?type="application\/ld\+json"(?:[^>]*?)>([\s\S]*?)<\/script>/gi;
  let match;
  const targetTypes = new Set(['car', 'vehicle', 'product', 'individualproduct', 'bus', 'motorcycle']);

  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const jsonText = match[1].trim();
      if (!jsonText) continue;
      const parsed = JSON.parse(jsonText);
      const schemaObj = findSchemaObject(parsed, targetTypes);

      if (schemaObj) {
        // Extract photos
        const photos: string[] = [];
        const imageProp = schemaObj.image;
        if (imageProp) {
          const rawUrls: string[] = [];
          if (typeof imageProp === 'string') {
            rawUrls.push(imageProp);
          } else if (Array.isArray(imageProp)) {
            imageProp.forEach((img: any) => {
              if (typeof img === 'string') rawUrls.push(img);
              else if (img && typeof img === 'object' && img.url) rawUrls.push(img.url);
            });
          } else if (typeof imageProp === 'object' && imageProp.url) {
            rawUrls.push(imageProp.url);
          }
          rawUrls.filter(Boolean).forEach((u) => {
            photos.push(u);
          });
        }

        // Extract price
        let priceAmount: number | undefined;
        let priceCurrency = 'BRL'; // Default to BRL for Brazil
        const offers = schemaObj.offers;
        if (offers) {
          if (typeof offers === 'object' && !Array.isArray(offers)) {
            priceAmount = parseNumber(offers.price);
            if (offers.priceCurrency) priceCurrency = String(offers.priceCurrency).toUpperCase();
          } else if (Array.isArray(offers) && offers.length > 0) {
            priceAmount = parseNumber(offers[0].price);
            if (offers[0].priceCurrency) priceCurrency = String(offers[0].priceCurrency).toUpperCase();
          }
        }

        // Extract brand
        let brandName: string | undefined;
        if (schemaObj.brand) {
          if (typeof schemaObj.brand === 'string') {
            brandName = schemaObj.brand;
          } else if (typeof schemaObj.brand === 'object') {
            brandName = schemaObj.brand.name;
          }
        }

        // Extract mileage
        let mileage: number | undefined;
        const milFromOdom = schemaObj.mileageFromOdometer;
        if (milFromOdom) {
          if (typeof milFromOdom === 'object') {
            mileage = parseNumber(milFromOdom.value);
          } else {
            mileage = parseNumber(milFromOdom);
          }
        }

        // Extract year
        let year: number | undefined;
        if (schemaObj.vehicleModelDate) {
          year = parseNumber(schemaObj.vehicleModelDate);
        } else if (schemaObj.productionDate) {
          year = new Date(schemaObj.productionDate).getFullYear() || undefined;
        } else if (schemaObj.modelDate) {
          year = parseNumber(schemaObj.modelDate);
        }

        return {
          title: schemaObj.name || schemaObj.title || undefined,
          brand: brandName,
          model: schemaObj.model || undefined,
          description: schemaObj.description || undefined,
          year,
          mileage,
          price: priceAmount ? { amount: priceAmount, currency: priceCurrency } : undefined,
          fuelType: schemaObj.fuelType || undefined,
          transmission: schemaObj.vehicleTransmission || undefined,
          bodyType: schemaObj.bodyType || undefined,
          color: schemaObj.color || undefined,
          photos,
        };
      }
    } catch {
      // Ignore invalid JSON-LD blocks
    }
  }

  return null;
}
