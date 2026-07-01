import { Platform } from 'react-native';
import dados from '@/data/distritos-concelhos.json';
import dadosBr from '@/data/estados-cidades-br.json';
import type { Country } from '@/lib/country';

/**
 * Whether the in-app map can be rendered.
 *
 * iOS draws maps with Apple Maps, which needs no key. Android uses Google Maps
 * (react-native-maps) and renders a blank tile grid without an API key, so we
 * only enable the map there when EXPO_PUBLIC_GOOGLE_MAPS_API_KEY is set. The var
 * is inlined into the bundle at build time, mirroring `app.config.ts`.
 */
export const mapsDisponivel =
  Platform.OS !== 'android' || !!process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

export interface ConcelhoDado {
  nome: string;
  lat: number;
  lng: number;
}

// The Brazilian dataset (states/cities) reuses this shape so every lookup
// below works for both markets: distrito = estado, concelho = cidade.
interface DistritoDado {
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

/**
 * Datasets to scan for a lookup. Names DO collide between the two markets
 * (e.g. "Santana" and "Santarém" exist in both PT and BR), so callers that
 * know the market must pass `country` to scope the search; without it the
 * lookup falls back to scanning both datasets, PT first.
 */
function datasetsFor(country?: Country): DistritoDado[][] {
  return country ? [DATASETS[country]] : [DATASETS.PT, DATASETS.BR];
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
      const c = d.concelhos.find((x) => x.nome.toLowerCase() === lower);
      if (c) return { lat: c.lat, lng: c.lng };
    }
  }
  return undefined;
}

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
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
