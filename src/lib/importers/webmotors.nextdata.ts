import { type NormalizedAdvert } from '@/lib/importers/standvirtual.nextdata';
import { extractSchemaOrgAdvert } from '@/lib/importers/schemaOrg';

// Recursive utility to find a key in a JSON object (case-insensitive)
function findValueByKey(obj: any, targetKey: string): any {
  if (!obj || typeof obj !== 'object') return null;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = findValueByKey(item, targetKey);
      if (found !== null && found !== undefined) return found;
    }
    return null;
  }

  const keys = Object.keys(obj);
  const match = keys.find((k) => k.toLowerCase() === targetKey.toLowerCase());
  if (match !== undefined) {
    return obj[match];
  }

  for (const key of keys) {
    const found = findValueByKey(obj[key], targetKey);
    if (found !== null && found !== undefined) return found;
  }

  return null;
}

export function extractNextData(html: string): any | null {
  const match = /<script\s+id="__NEXT_DATA__"\s+type="application\/json"[^>]*>([\s\S]*?)<\/script>/i.exec(html);
  if (!match) return null;
  try {
    return JSON.parse(match[1].trim());
  } catch {
    return null;
  }
}

function resolveName(obj: any): string | undefined {
  if (!obj) return undefined;
  if (typeof obj === 'string') return obj;
  if (typeof obj === 'object') {
    return obj.name || obj.Name || obj.value || obj.label || undefined;
  }
  return undefined;
}

function parseNumber(val: any): number | null {
  if (val === null || val === undefined) return null;
  const num = Number(String(val).replace(/[^\d.,]/g, '').replace(',', '.'));
  return isNaN(num) ? null : num;
}

/**
 * Parses Webmotors Next.js __NEXT_DATA__ script and normalizes it.
 * Falls back to schema.org/Vehicle extraction if Next.js props are missing.
 */
export function normalizeWebmotorsAdvert(html: string, url: string): NormalizedAdvert | null {
  const nextData = extractNextData(html);
  
  // Extract ID from URL
  const segments = url.replace(/\/$/, '').split('/');
  const adId = segments[segments.length - 1] || 'webmotors_ad';

  let title = '';
  let brand = '';
  let model = '';
  let version = '';
  let year: number | null = null;
  let priceValue: number | null = null;
  let mileage: number | null = null;
  let fuelType = '';
  let transmission = '';
  let color = '';
  let description = '';
  let photoUrls: string[] = [];

  if (nextData) {
    // Look for advert details in props
    const pageProps = nextData.props?.pageProps;
    if (pageProps) {
      // Common locations: pageProps.advert, pageProps.vehicle, pageProps.detail
      const ad = pageProps.advert || pageProps.vehicle || pageProps.detail || pageProps;
      
      const rawBrand = findValueByKey(ad, 'make') || findValueByKey(ad, 'marca');
      brand = resolveName(rawBrand) || '';

      const rawModel = findValueByKey(ad, 'model') || findValueByKey(ad, 'modelo');
      model = resolveName(rawModel) || '';

      const rawVersion = findValueByKey(ad, 'version') || findValueByKey(ad, 'versao');
      version = resolveName(rawVersion) || '';

      year = parseNumber(findValueByKey(ad, 'yearModel') || findValueByKey(ad, 'anoModelo') || findValueByKey(ad, 'year') || findValueByKey(ad, 'ano'));
      priceValue = parseNumber(findValueByKey(ad, 'price') || findValueByKey(ad, 'value') || findValueByKey(ad, 'preco') || findValueByKey(ad, 'valor'));
      mileage = parseNumber(findValueByKey(ad, 'odometer') || findValueByKey(ad, 'mileage') || findValueByKey(ad, 'km') || findValueByKey(ad, 'quilometragem'));
      
      fuelType = resolveName(findValueByKey(ad, 'fuelType') || findValueByKey(ad, 'fuel') || findValueByKey(ad, 'combustivel')) || '';
      transmission = resolveName(findValueByKey(ad, 'transmission') || findValueByKey(ad, 'cambio') || findValueByKey(ad, 'gearbox')) || '';
      color = resolveName(findValueByKey(ad, 'color') || findValueByKey(ad, 'cor')) || '';
      description = resolveName(findValueByKey(ad, 'description') || findValueByKey(ad, 'descricao') || findValueByKey(ad, 'observacao') || findValueByKey(ad, 'observacoes')) || '';

      // Photos
      const rawPhotos = findValueByKey(ad, 'photos') || findValueByKey(ad, 'images') || findValueByKey(ad, 'fotos');
      if (Array.isArray(rawPhotos)) {
        photoUrls = rawPhotos
          .map((p: any) => {
            if (typeof p === 'string') return p;
            if (p && typeof p === 'object') return p.url || p.path || p.src;
            return null;
          })
          .filter((u): u is string => typeof u === 'string' && !!u);
      }
    }
  }

  // Fallback to schema.org if data is sparse
  if (!brand || !model || photoUrls.length === 0) {
    const schemaData = extractSchemaOrgAdvert(html, url);
    if (schemaData) {
      title = schemaData.title || title;
      brand = schemaData.brand || brand;
      model = schemaData.model || model;
      year = schemaData.year ?? year;
      priceValue = schemaData.price?.amount ?? priceValue;
      mileage = schemaData.mileage ?? mileage;
      fuelType = schemaData.fuelType || fuelType;
      transmission = schemaData.transmission || transmission;
      color = schemaData.color || color;
      description = schemaData.description || description;
      if (photoUrls.length === 0 && schemaData.photos) {
        photoUrls = schemaData.photos;
      }
    }
  }

  if (!brand && !title) {
    return null; // Extraction failed completely
  }

  // Reconstruct title if not set
  if (!title) {
    title = [brand, model, version].filter(Boolean).join(' ');
  }

  // Construct flat parameters list matching standvirtual shape
  const params: Record<string, { value: string; label: string }> = {};
  if (brand) params['marca'] = { value: brand.toLowerCase(), label: brand };
  if (model) params['modelo'] = { value: model.toLowerCase(), label: model };
  if (version) params['versao'] = { value: version.toLowerCase(), label: version };
  if (year) params['ano'] = { value: String(year), label: String(year) };
  if (mileage !== null) params['quilometragem'] = { value: String(mileage), label: `${mileage} km` };
  if (fuelType) params['combustivel'] = { value: fuelType.toLowerCase(), label: fuelType };
  if (transmission) params['cambio'] = { value: transmission.toLowerCase(), label: transmission };
  if (color) params['cor'] = { value: color.toLowerCase(), label: color };

  return {
    adId,
    url,
    title,
    descriptionHtml: description.replace(/\n/g, '<br>'),
    priceValue,
    currency: 'BRL',
    photos: photoUrls,
    params,
    equipmentKeys: [],
    location: {},
    active: true,
  };
}
