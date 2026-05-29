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

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

export function calculateMarketStats(precos: number[]): MarketStats | null {
  const validos = precos.filter((p) => typeof p === 'number' && p > 0 && Number.isFinite(p));
  if (validos.length === 0) return null;

  const sorted = [...validos].sort((a, b) => a - b);
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
  const deviation = (preco - referencia) / referencia;

  let indicator: PriceIndicator = 'justo';
  if (deviation <= PRICE_THRESHOLDS.abaixo) indicator = 'abaixo';
  else if (deviation >= PRICE_THRESHOLDS.acima) indicator = 'acima';

  return { indicator, deviation, stats, sampleSize: stats.count };
}

export function filtrarCarrosSimilares(
  todos: Carro[],
  criterios: { marca: string; modelo: string; ano?: number; excludeId?: string },
): Carro[] {
  const marcaNorm = normalizeMarca(criterios.marca);
  const modeloNorm = normalizeModelo(criterios.modelo);
  if (!marcaNorm || !modeloNorm) return [];

  return todos.filter((c) => {
    if (criterios.excludeId && c.id === criterios.excludeId) return false;
    if (normalizeMarca(c.marca) !== marcaNorm) return false;
    const candidatoModelo = normalizeModelo(c.modelo);
    const baseToken = modeloNorm.split(' ')[0];
    if (!candidatoModelo.includes(baseToken)) return false;
    if (criterios.ano && c.anoFabricacao) {
      const diff = Math.abs(c.anoFabricacao - criterios.ano);
      if (diff > PRICE_THRESHOLDS.similarYearRange) return false;
    }
    return true;
  });
}

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
      const ajuste = -kmDelta * 0.02;
      estimate = Math.max(estimate + ajuste, stats.min * 0.5);
    }
  }

  const rangeMin = Math.round(Math.max(stats.p25, estimate * 0.85));
  const rangeMax = Math.round(Math.min(stats.p75, estimate * 1.15) || estimate * 1.15);

  let confidence: 'baixa' | 'media' | 'alta' = 'baixa';
  if (stats.count >= 10) confidence = 'alta';
  else if (stats.count >= 5) confidence = 'media';

  return {
    estimate: Math.round(estimate),
    rangeMin,
    rangeMax: Math.max(rangeMax, rangeMin + 1),
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
