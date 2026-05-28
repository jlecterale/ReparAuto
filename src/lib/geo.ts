import dados from '@/data/distritos-concelhos.json';

export interface ConcelhoDado {
  nome: string;
  lat: number;
  lng: number;
}

export interface DistritoDado {
  distrito: string;
  concelhos: ConcelhoDado[];
}

const distritosDados = dados as DistritoDado[];

export const DISTRITOS = distritosDados.map((d) => d.distrito).sort((a, b) =>
  a.localeCompare(b, 'pt')
);

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
    const c = d.concelhos.find((c) => c.nome.toLowerCase() === lower);
    if (c) return { lat: c.lat, lng: c.lng };
  }
  return undefined;
}

export function getAllConcelhos(): string[] {
  return distritosDados
    .flatMap((d) => d.concelhos.map((c) => c.nome))
    .sort((a, b) => a.localeCompare(b, 'pt'));
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
