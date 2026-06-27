import { Platform } from 'react-native';
import dados from '@/data/distritos-concelhos.json';

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

interface DistritoDado {
  distrito: string;
  concelhos: ConcelhoDado[];
}

const distritosDados = dados as DistritoDado[];

export function getConcelhos(distrito: string): ConcelhoDado[] {
  return distritosDados.find((d) => d.distrito === distrito)?.concelhos ?? [];
}

export function getDistritoForConcelho(nome: string): string | undefined {
  const lower = nome.toLowerCase();
  for (const d of distritosDados) {
    if (d.concelhos.some((c) => c.nome.toLowerCase() === lower)) return d.distrito;
  }
  return undefined;
}

export function getCoordenadas(nome: string): { lat: number; lng: number } | undefined {
  const lower = nome.toLowerCase();
  for (const d of distritosDados) {
    const c = d.concelhos.find((x) => x.nome.toLowerCase() === lower);
    if (c) return { lat: c.lat, lng: c.lng };
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
