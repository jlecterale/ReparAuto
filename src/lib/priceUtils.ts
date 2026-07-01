import { PRICE_THRESHOLDS } from '@/lib/constants';
import type { Carro } from '@/types/carro';
import type {
  MarketStats,
  PriceEstimate,
  PriceEstimateInput,
  PriceIndicator,
  PriceIndicatorResult,
} from '@/types/preco';

export function normalizeModelo(modelo: string): string {
  if (!modelo) return '';
  return modelo
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

export function normalizeMarca(marca: string): string {
  return normalizeModelo(marca);
}

// Tokens to strip from model names when comparing: engine codes, displacement,
// transmission hints. Keeps the "base trim" (e.g. "Golf IV", "C220", "3008").
const ENGINE_TOKENS = new Set([
  'tdi', 'tfsi', 'tsi', 'cdi', 'hdi', 'dci', 'hse', 'multijet', 'mjt',
  'crdi', 'd4d', 'd4', 'cti', 'evo', 'sport', 'comfort', 'style',
  'gasolina', 'diesel', 'manual', 'auto', 'automatico', 'eletrico', 'hibrido',
  'cv', 'hp', 'kw', 'cc', 'v', 'i', // single roman/numeric noise
]);

function isDisplacementToken(t: string): boolean {
  return /^\d+\.\d+$/.test(t) || /^\d{3,4}cc$/.test(t);
}

export function modelBaseTokens(modelo: string): string[] {
  const tokens = normalizeModelo(modelo).split(' ').filter(Boolean);
  return tokens.filter((t) => !isDisplacementToken(t) && !ENGINE_TOKENS.has(t));
}

export function isSameModel(a: string, b: string): boolean {
  const ta = modelBaseTokens(a);
  const tb = modelBaseTokens(b);
  if (ta.length === 0 || tb.length === 0) return false;
  if (ta[0] !== tb[0]) return false;
  const minLen = Math.min(ta.length, tb.length);
  for (let i = 1; i < minLen; i++) {
    if (ta[i] !== tb[i]) return false;
  }
  return true;
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return NaN;
  if (sorted.length === 1) return sorted[0];
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

// Trim values that fall outside the 1.5×IQR Tukey fence. Essential for the
// low-cost segment where junk/salvage cars and rare classics can otherwise
// drag the median in either direction.
function trimOutliers(sorted: number[]): number[] {
  if (sorted.length < 4) return sorted;
  const p25 = quantile(sorted, 0.25);
  const p75 = quantile(sorted, 0.75);
  const iqr = p75 - p25;
  if (iqr <= 0) return sorted;
  const lower = p25 - PRICE_THRESHOLDS.outlierIqrMultiplier * iqr;
  const upper = p75 + PRICE_THRESHOLDS.outlierIqrMultiplier * iqr;
  return sorted.filter((v) => v >= lower && v <= upper);
}

export function calculateMarketStats(precos: number[]): MarketStats | null {
  const validos = precos.filter((p) => typeof p === 'number' && p > 0 && Number.isFinite(p));
  if (validos.length === 0) return null;

  const sortedRaw = [...validos].sort((a, b) => a - b);
  const sorted = trimOutliers(sortedRaw);
  if (sorted.length === 0) return null;

  const count = sorted.length;
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const mean = sum / count;
  const median = quantile(sorted, 0.5);
  const p25 = quantile(sorted, 0.25);
  const p75 = quantile(sorted, 0.75);
  const min = sorted[0];
  const max = sorted[count - 1];
  const variance =
    sorted.reduce((acc, v) => acc + (v - mean) * (v - mean), 0) / count;
  const stdDev = Math.sqrt(variance);

  return { count, min, max, mean, median, p25, p75, stdDev };
}

export function calculatePriceIndicator(
  preco: number,
  similares: Carro[],
): PriceIndicatorResult {
  const precos = similares.map((c) => c.preco);
  const stats = calculateMarketStats(precos);

  if (!stats || stats.count < PRICE_THRESHOLDS.minSampleSize) {
    return {
      indicator: 'indisponivel',
      deviation: 0,
      stats,
      sampleSize: stats?.count ?? 0,
    };
  }

  const referencia = stats.median;
  if (!referencia || referencia <= 0 || !Number.isFinite(preco) || preco <= 0) {
    return { indicator: 'indisponivel', deviation: 0, stats, sampleSize: stats.count };
  }

  const deviation = (preco - referencia) / referencia;

  // Adaptive band: wider when the market itself is more dispersed, but always
  // bounded between the configured floor and ceiling.
  const cv = stats.stdDev / referencia;
  const okBand = Math.max(
    PRICE_THRESHOLDS.adaptiveMin,
    Math.min(PRICE_THRESHOLDS.adaptiveMax, cv),
  );
  const greatBand = PRICE_THRESHOLDS.greatDeal;

  let indicator: PriceIndicator;
  if (deviation <= -greatBand) indicator = 'excelente';
  else if (deviation <= -okBand) indicator = 'bom';
  else if (deviation < okBand) indicator = 'justo';
  else if (deviation < greatBand) indicator = 'acima';
  else indicator = 'sobrevalorizado';

  return { indicator, deviation, stats, sampleSize: stats.count };
}

// Index cache keyed by the carros array reference, so repeated calls during
// the same render (e.g. one per CarCard) reuse the same Map.
const marcaIndexCache = new WeakMap<Carro[], Map<string, Carro[]>>();

export function indexCarrosByMarca(carros: Carro[]): Map<string, Carro[]> {
  const cached = marcaIndexCache.get(carros);
  if (cached) return cached;
  const map = new Map<string, Carro[]>();
  for (const c of carros) {
    const key = normalizeMarca(c.marca);
    const arr = map.get(key);
    if (arr) arr.push(c);
    else map.set(key, [c]);
  }
  marcaIndexCache.set(carros, map);
  return map;
}

export function filtrarCarrosSimilares(
  todos: Carro[],
  criterios: { marca: string; modelo: string; ano?: number; excludeId?: string },
): Carro[] {
  const marcaNorm = normalizeMarca(criterios.marca);
  if (!marcaNorm || !criterios.modelo) return [];

  const index = indexCarrosByMarca(todos);
  const candidatos = index.get(marcaNorm) ?? [];

  return candidatos.filter((c) => {
    if (criterios.excludeId && c.id === criterios.excludeId) return false;
    if (!isSameModel(criterios.modelo, c.modelo)) return false;
    // "Para peças" (parts-only, non-running) listings are a different product
    // from a working car of the same model — including them would drag the
    // median toward salvage prices instead of market value.
    if (c.condition === 'Para peças') return false;
    if (criterios.ano && c.anoFabricacao) {
      const diff = Math.abs(c.anoFabricacao - criterios.ano);
      if (diff > PRICE_THRESHOLDS.similarYearRange) return false;
    }
    return true;
  });
}

// Per-fuel depreciation per km, in €/km. Calibrated for the Portuguese used-car
// low-cost segment from rough market observation. Always clamped so the
// estimate cannot fall below 30% of the sample minimum.
const KM_DEPRECIATION: Record<string, number> = {
  Diesel: 0.020,
  Gasolina: 0.030,
  Híbrido: 0.025,
  Elétrico: 0.040,
  Etanol: 0.028,
  Flex: 0.028,
};
const KM_DEFAULT = 0.025;

export function calculatePriceEstimate(
  input: PriceEstimateInput,
  carros: Carro[],
): PriceEstimate {
  const similares = filtrarCarrosSimilares(carros, {
    marca: input.marca,
    modelo: input.modelo,
    ano: input.ano,
  });

  const stats = calculateMarketStats(similares.map((c) => c.preco));

  if (!stats || stats.count === 0) {
    return {
      estimate: 0,
      rangeMin: 0,
      rangeMax: 0,
      sampleSize: 0,
      confidence: 'baixa',
      stats: null,
    };
  }

  let estimate = stats.median;

  if (input.km && stats.count >= 3) {
    const carrosComKm = similares.filter((c) => c.km && c.km > 0);
    if (carrosComKm.length >= 3) {
      const kmMedio = carrosComKm.reduce((s, c) => s + c.km, 0) / carrosComKm.length;
      const kmDelta = input.km - kmMedio;
      const factor = KM_DEPRECIATION[input.combustivel ?? ''] ?? KM_DEFAULT;
      const ajuste = -kmDelta * factor;
      const piso = stats.min * 0.3;
      const teto = stats.max * 1.2;
      estimate = Math.max(piso, Math.min(teto, estimate + ajuste));
    }
  }

  const rangeMin = Math.round(Math.max(stats.p25, estimate * 0.85));
  const rangeMaxRaw = Math.max(stats.p75, estimate * 1.15);
  const rangeMax = Math.round(Math.max(rangeMaxRaw, rangeMin + 1));

  let confidence: 'baixa' | 'media' | 'alta' = 'baixa';
  if (stats.count >= 10) confidence = 'alta';
  else if (stats.count >= 5) confidence = 'media';

  return {
    estimate: Math.round(estimate),
    rangeMin,
    rangeMax,
    sampleSize: stats.count,
    confidence,
    stats,
  };
}

export function priceDistributionBuckets(
  precos: number[],
  bucketCount = 8,
): Array<{ label: string; min: number; max: number; count: number }> {
  if (precos.length === 0) return [];
  const sorted = [...precos].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  if (min === max) {
    return [{ label: `${min}€`, min, max, count: sorted.length }];
  }
  const step = (max - min) / bucketCount;
  const buckets = Array.from({ length: bucketCount }, (_, i) => {
    const bMin = Math.round(min + step * i);
    const bMax = Math.round(min + step * (i + 1));
    return {
      label: `${bMin}–${bMax}€`,
      min: bMin,
      max: bMax,
      count: 0,
    };
  });
  for (const p of sorted) {
    let idx = Math.floor((p - min) / step);
    if (idx >= bucketCount) idx = bucketCount - 1;
    buckets[idx].count++;
  }
  return buckets;
}
