// Brazilian municipalities for the location pickers (plan 20). The curated
// estados-cidades-br.json only carries a handful of cities per state (kept for
// their coordinates, used by radius search); the full list of ~5.570
// municipalities comes from the IBGE localities dataset via BrasilAPI. Cached
// in AsyncStorage so a state is fetched once. Mirrors the web `src/lib/ibge.ts`
// (which uses the synchronous localStorage instead of AsyncStorage).

import AsyncStorage from '@react-native-async-storage/async-storage';

const UF_BY_ESTADO: Record<string, string> = {
  Acre: 'AC',
  Alagoas: 'AL',
  Amapá: 'AP',
  Amazonas: 'AM',
  Bahia: 'BA',
  Ceará: 'CE',
  'Distrito Federal': 'DF',
  'Espírito Santo': 'ES',
  Goiás: 'GO',
  Maranhão: 'MA',
  'Mato Grosso': 'MT',
  'Mato Grosso do Sul': 'MS',
  'Minas Gerais': 'MG',
  Pará: 'PA',
  Paraíba: 'PB',
  Paraná: 'PR',
  Pernambuco: 'PE',
  Piauí: 'PI',
  'Rio de Janeiro': 'RJ',
  'Rio Grande do Norte': 'RN',
  'Rio Grande do Sul': 'RS',
  Rondônia: 'RO',
  Roraima: 'RR',
  'Santa Catarina': 'SC',
  'São Paulo': 'SP',
  Sergipe: 'SE',
  Tocantins: 'TO',
};

export function ufForEstado(estado: string): string | undefined {
  return UF_BY_ESTADO[estado];
}

const ESTADO_BY_UF: Record<string, string> = Object.fromEntries(
  Object.entries(UF_BY_ESTADO).map(([nome, uf]) => [uf, nome]),
);

export function estadoForUf(uf: string): string | undefined {
  return ESTADO_BY_UF[uf?.toUpperCase()];
}

const SMALL_WORDS = new Set(['da', 'de', 'do', 'das', 'dos', 'e', 'd']);

// IBGE names come uppercased ("SÃO PAULO", "MOGI DAS CRUZES"); render them in
// title case, keeping the Portuguese connectors lowercase.
export function toTitleCasePt(name: string): string {
  return name
    .trim()
    .toLocaleLowerCase('pt-BR')
    .split(/\s+/)
    .map((w, i) => (i > 0 && SMALL_WORDS.has(w) ? w : w.charAt(0).toLocaleUpperCase('pt-BR') + w.slice(1)))
    .join(' ');
}

const CACHE_PREFIX = 'ibge_cidades_';
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface CacheEntry {
  timestamp: number;
  cidades: string[];
}

async function readCache(uf: string): Promise<string[] | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + uf);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    if (Date.now() - entry.timestamp >= CACHE_TTL_MS) return null;
    return entry.cidades;
  } catch {
    return null;
  }
}

async function writeCache(uf: string, cidades: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_PREFIX + uf, JSON.stringify({ timestamp: Date.now(), cidades }));
  } catch {
    // Storage full/unavailable — caching is best-effort.
  }
}

/**
 * All municipalities of a Brazilian state (by full state name), title-cased and
 * sorted. Cached for 30 days; returns [] for an unknown state or on failure so
 * the picker degrades gracefully instead of throwing.
 */
export async function fetchBrCities(estado: string): Promise<string[]> {
  const uf = UF_BY_ESTADO[estado];
  if (!uf) return [];
  const cached = await readCache(uf);
  if (cached) return cached;
  const res = await fetch(`https://brasilapi.com.br/api/ibge/municipios/v1/${uf}`);
  if (!res.ok) throw new Error(`IBGE request failed: ${res.status}`);
  const data = (await res.json()) as { nome: string }[];
  const cidades = [...new Set(data.map((m) => toTitleCasePt(m.nome)))].sort((a, b) => a.localeCompare(b, 'pt'));
  await writeCache(uf, cidades);
  return cidades;
}
