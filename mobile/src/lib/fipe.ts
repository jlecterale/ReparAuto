// FIPE vehicle catalog for the Brazilian market — mirrors the web
// `src/lib/fipe.ts`. Brands/models come from the public Parallelum FIPE API
// (BrasilAPI's FIPE proxy currently 403s) and are cached in AsyncStorage so
// the Anunciar flow doesn't hit the API — and its rate limit — on every load.

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TipoVeiculo } from '@/types';

const FIPE_BASE_URL = 'https://parallelum.com.br/fipe/api/v1';
const BRANDS_CACHE_KEY = 'fipe_marcas_cache';
const MODELS_CACHE_KEY = 'fipe_modelos_cache';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export interface FipeBrand {
  codigo: string;
  nome: string;
}

// FIPE only distinguishes cars, motorbikes and trucks; light commercial
// vehicles live under "carros".
function fipeVehiclePath(tipo?: TipoVeiculo): string {
  return tipo === 'moto' ? 'motos' : 'carros';
}

/**
 * Cut a FIPE trim-level name down to the base model: keep the leading words,
 * stopping at the first spec token (engine size, valve count, short all-caps
 * trim code). Numeric model names (Peugeot 206) keep only the number.
 */
export function simplifyFipeModelName(name: string): string {
  const tokens = name.trim().split(/\s+/);
  if (tokens.length === 0) return name.trim();
  const kept = [tokens[0]];
  if (!/\d/.test(tokens[0])) {
    for (const token of tokens.slice(1)) {
      const isSpec = /[\d./]/.test(token);
      const isTrimCode = token.length <= 4 && token === token.toUpperCase();
      if (isSpec || isTrimCode) break;
      kept.push(token);
    }
  }
  return kept
    .map((token) => (token === token.toUpperCase() && /\p{L}/u.test(token)
      ? token.charAt(0) + token.slice(1).toLocaleLowerCase('pt-BR')
      : token))
    .join(' ');
}

/** Simplify every trim name and collapse duplicates into a sorted model list. */
export function dedupeModelNames(names: string[]): string[] {
  const seen = new Map<string, string>();
  for (const name of names) {
    const base = simplifyFipeModelName(name);
    const key = base.toLocaleLowerCase('pt-BR');
    if (!seen.has(key)) seen.set(key, base);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b, 'pt'));
}

interface CacheEntry<T> {
  timestamp: number;
  data: T;
}

async function readCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() - entry.timestamp >= CACHE_TTL_MS) return null;
    return entry.data;
  } catch {
    return null;
  }
}

async function writeCache<T>(key: string, data: T): Promise<void> {
  try {
    const entry: CacheEntry<T> = { timestamp: Date.now(), data };
    await AsyncStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // storage full or unavailable — caching is best-effort.
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FIPE request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

/** All FIPE brands for a vehicle type, cached for 24h. */
export async function fetchFipeBrands(tipo?: TipoVeiculo): Promise<FipeBrand[]> {
  const path = fipeVehiclePath(tipo);
  const cacheKey = `${BRANDS_CACHE_KEY}_${path}`;
  const cached = await readCache<FipeBrand[]>(cacheKey);
  if (cached) return cached;
  const brands = await fetchJson<FipeBrand[]>(`${FIPE_BASE_URL}/${path}/marcas`);
  await writeCache(cacheKey, brands);
  return brands;
}

/** Deduplicated base model names for a brand (by FIPE brand code), cached for 24h. */
export async function fetchFipeModels(brandCode: string, tipo?: TipoVeiculo): Promise<string[]> {
  const path = fipeVehiclePath(tipo);
  const cacheKey = `${MODELS_CACHE_KEY}_${path}_${brandCode}`;
  const cached = await readCache<string[]>(cacheKey);
  if (cached) return cached;
  const payload = await fetchJson<{ modelos: { nome: string }[] }>(
    `${FIPE_BASE_URL}/${path}/marcas/${brandCode}/modelos`,
  );
  const models = dedupeModelNames(payload.modelos.map((m) => m.nome));
  await writeCache(cacheKey, models);
  return models;
}
