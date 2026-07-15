import dados from '@/data/distritos-concelhos.json';
import dadosBr from '@/data/estados-cidades-br.json';
import type { Country } from '@/lib/country';

export interface ConcelhoDado {
  nome: string;
  lat: number;
  lng: number;
}

// The Brazilian dataset (states/cities) reuses this shape so every lookup
// below works for both markets: distrito = estado, concelho = cidade.
export interface DistritoDado {
  distrito: string;
  concelhos: ConcelhoDado[];
}

const distritosDados = dados as DistritoDado[];
const estadosBrDados = dadosBr as DistritoDado[];

const DATASETS: Record<Country, DistritoDado[]> = {
  PT: distritosDados,
  BR: estadosBrDados,
};

/** Region names (PT distritos / BR estados) for the given market. */
export function getDistritos(country: Country = 'PT'): string[] {
  return DATASETS[country].map((d) => d.distrito).sort((a, b) => a.localeCompare(b, 'pt'));
}

// Place names DO collide between the markets (Santana and Santarém exist in
// both PT and BR), so pass the market whenever the caller knows it — the
// listing's docCountry() or the active country. Without it, both datasets are
// searched with PT first (correct for all legacy data, which is Portuguese).
function datasetsFor(country?: Country): DistritoDado[][] {
  return country ? [DATASETS[country]] : [distritosDados, estadosBrDados];
}

export function getConcelhos(distrito: string, country?: Country): ConcelhoDado[] {
  for (const dataset of datasetsFor(country)) {
    const match = dataset.find((d) => d.distrito === distrito);
    if (match) return match.concelhos;
  }
  return [];
}

export function getDistritoForConcelho(nome: string, country?: Country): string | undefined {
  const lower = nome.toLowerCase();
  for (const dataset of datasetsFor(country)) {
    for (const d of dataset) {
      if (d.concelhos.some((c) => c.nome.toLowerCase() === lower)) return d.distrito;
    }
  }
  return undefined;
}

export function getCoordenadas(nome: string, country?: Country): { lat: number; lng: number } | undefined {
  const lower = nome.toLowerCase();
  for (const dataset of datasetsFor(country)) {
    for (const d of dataset) {
      const c = d.concelhos.find((c) => c.nome.toLowerCase() === lower);
      if (c) return { lat: c.lat, lng: c.lng };
    }
  }
  return undefined;
}

export function getCentroDistrito(distrito: string): { lat: number; lng: number } | undefined {
  const concelhos = getConcelhos(distrito);
  if (concelhos.length === 0) return undefined;
  const lat = concelhos.reduce((s, c) => s + c.lat, 0) / concelhos.length;
  const lng = concelhos.reduce((s, c) => s + c.lng, 0) / concelhos.length;
  return { lat, lng };
}

export const CENTRO_PORTUGAL: { lat: number; lng: number } = { lat: 39.6, lng: -8.0 };

export function getAllConcelhos(): string[] {
  return distritosDados
    .flatMap((d) => d.concelhos.map((c) => c.nome))
    .sort((a, b) => a.localeCompare(b, 'pt'));
}

// In-memory cache so repeated lookups of the same city (e.g. multiple users
// publishing from Uberlândia in the same session) reuse the result.
const geocodeCache = new Map<string, { lat: number; lng: number }>();

/**
 * Geocode a city/state pair via Nominatim (OpenStreetMap). Used as a fallback
 * when the static dataset doesn't have coordinates for the city (e.g. most
 * Brazilian municipalities beyond the ~108 curated ones).
 *
 * Nominatim's usage policy requires a meaningful User-Agent and max 1 req/s.
 * This is called at publish time (user action), so the rate limit is fine.
 */
export async function geocodeAddress(
  city: string,
  state: string,
  country: Country,
): Promise<{ lat: number; lng: number } | null> {
  if (!city || city.length > 200) return null;

  const cacheKey = `${city.toLowerCase()}|${state.toLowerCase()}|${country}`;
  const cached = geocodeCache.get(cacheKey);
  if (cached) return cached;

  const countryName = country === 'PT' ? 'Portugal' : 'Brasil';
  const query = state ? `${city}, ${state}, ${countryName}` : `${city}, ${countryName}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
      { headers: { 'User-Agent': 'RecarGarage/1.0' }, signal: controller.signal },
    );
    if (!res.ok) return null;
    const data: Array<{ lat: string; lon: string }> = await res.json();
    if (data.length === 0) return null;

    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);
    if (!isFinite(lat) || !isFinite(lng)) return null;

    const result = { lat, lng };
    geocodeCache.set(cacheKey, result);
    return result;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}
