import {
  calculateMarketStats,
  calculatePriceEstimate,
  calculatePriceIndicator,
  filtrarCarrosSimilares,
  indexCarrosByMarca,
  isSameModel,
  modelBaseTokens,
  normalizeMarca,
  normalizeModelo,
  priceDistributionBuckets,
} from '@/lib/priceUtils';
import { PRICE_THRESHOLDS } from '@/lib/constants';
import type { Carro } from '@/types/carro';

// ---------------------------------------------------------------------------
// Test fixture — mimics the shape of a Firestore `cars` document. We only set
// the fields the price utils actually read; everything else is filled with
// harmless defaults so the object satisfies the `Carro` type.
// ---------------------------------------------------------------------------
function carro(overrides: Partial<Carro> & { id: string; marca: string; modelo: string; preco: number; anoFabricacao: number }): Carro {
  return {
    km: 0,
    combustivel: 'Diesel',
    cambio: 'Manual',
    cor: 'Preto',
    portas: 5,
    local: 'Lisboa',
    descricao: '',
    estadoVeiculo: 'pronto',
    tiposManutencao: [],
    fotos: [],
    criador: 'a@b.pt',
    status: 'aprovado',
    dataCriacao: { toMillis: () => 0, toDate: () => new Date(0) } as unknown as Carro['dataCriacao'],
    ...overrides,
  } as Carro;
}

describe('normalizeModelo / normalizeMarca', () => {
  it('lower-cases, trims, collapses whitespace', () => {
    expect(normalizeModelo('  Golf   IV ')).toBe('golf iv');
  });

  it('is empty-string safe', () => {
    expect(normalizeModelo('')).toBe('');
    expect(normalizeMarca('')).toBe('');
  });

  it('normalizeMarca aliases normalizeModelo', () => {
    expect(normalizeMarca('Mercedes-Benz')).toBe(normalizeModelo('Mercedes-Benz'));
  });
});

describe('modelBaseTokens', () => {
  it('strips engine codes like TDI / CDI / dCi', () => {
    expect(modelBaseTokens('Golf IV 1.9 TDI')).toEqual(['golf', 'iv']);
    expect(modelBaseTokens('C220 CDI')).toEqual(['c220']);
    expect(modelBaseTokens('Clio 1.5 dCi')).toEqual(['clio']);
  });

  it('strips displacement tokens (1.5, 2.0, 1998cc)', () => {
    expect(modelBaseTokens('308 1.6 HDI')).toEqual(['308']);
    expect(modelBaseTokens('A4 2.0')).toEqual(['a4']);
  });

  it('preserves purely numeric model names', () => {
    // "3008", "5008", "A4" must survive so they can match themselves
    expect(modelBaseTokens('3008')).toEqual(['3008']);
    expect(modelBaseTokens('A4')).toEqual(['a4']);
  });

  it('returns empty for blank input', () => {
    expect(modelBaseTokens('')).toEqual([]);
    expect(modelBaseTokens('   ')).toEqual([]);
  });
});

describe('isSameModel', () => {
  it('matches the same model with different engines', () => {
    expect(isSameModel('Golf IV 1.9 TDI', 'Golf IV 2.0 TDI')).toBe(true);
  });

  it('does NOT match different generations of the same nameplate', () => {
    expect(isSameModel('Golf IV 1.9 TDI', 'Golf VII 1.5 TSI')).toBe(false);
  });

  it('matches "3008" with itself but not with "5008"', () => {
    expect(isSameModel('3008', '3008 GT Line')).toBe(true);
    expect(isSameModel('3008', '5008')).toBe(false);
  });

  it('does NOT match when the first significant token differs', () => {
    // Regression: the old split(' ')[0] matcher failed here because
    // "A" prefixed any Audi Ax / Mercedes A-Class model.
    expect(isSameModel('A4', 'A6')).toBe(false);
  });

  it('returns false when either side has no meaningful tokens', () => {
    expect(isSameModel('', 'Golf')).toBe(false);
    expect(isSameModel('Golf', '')).toBe(false);
    // 'TDI' alone is a stripped engine token, so no base tokens remain
    expect(isSameModel('TDI', 'Golf IV')).toBe(false);
  });
});

describe('calculateMarketStats', () => {
  it('returns null for empty input', () => {
    expect(calculateMarketStats([])).toBeNull();
  });

  it('ignores non-positive and non-finite values', () => {
    const s = calculateMarketStats([100, 200, 0, -50, NaN, Infinity]);
    expect(s?.count).toBe(2);
    expect(s?.min).toBe(100);
    expect(s?.max).toBe(200);
  });

  it('computes median and P25/P75 correctly', () => {
    // 10 values → tidy interpolated quantiles
    const s = calculateMarketStats([100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]);
    expect(s?.median).toBeCloseTo(550, 5);
    expect(s?.p25).toBeCloseTo(325, 5);
    expect(s?.p75).toBeCloseTo(775, 5);
    expect(s?.mean).toBeCloseTo(550, 5);
  });

  it('trims outliers with the 1.5×IQR Tukey fence', () => {
    // Cluster of 8 samples around 5000, plus one salvage car at 100 and
    // one classic at 50000. The fence should drop the two extremes.
    const raw = [100, 4800, 4900, 5000, 5100, 5200, 5300, 5400, 5500, 50000];
    const s = calculateMarketStats(raw)!;
    expect(s.min).toBeGreaterThanOrEqual(4000);
    expect(s.max).toBeLessThanOrEqual(6500);
    expect(s.count).toBeLessThan(raw.length);
  });

  it('keeps all values when IQR is zero', () => {
    // All-equal input: trimming would otherwise remove everything
    const s = calculateMarketStats([500, 500, 500, 500])!;
    expect(s.count).toBe(4);
    expect(s.median).toBe(500);
    expect(s.stdDev).toBe(0);
  });
});

describe('calculatePriceIndicator', () => {
  // Build a tight sample of similar cars, mediana ≈ 5000
  const similares: Carro[] = [4700, 4800, 4900, 5000, 5100, 5200, 5300].map((preco, i) =>
    carro({ id: `c${i}`, marca: 'VW', modelo: 'Golf IV', preco, anoFabricacao: 2003 }),
  );

  it('returns "indisponivel" when the sample is below minSampleSize', () => {
    const small = similares.slice(0, PRICE_THRESHOLDS.minSampleSize - 1);
    const r = calculatePriceIndicator(5000, small);
    expect(r.indicator).toBe('indisponivel');
    expect(r.sampleSize).toBe(PRICE_THRESHOLDS.minSampleSize - 1);
  });

  it('labels a price within ~±10% as "justo"', () => {
    expect(calculatePriceIndicator(5000, similares).indicator).toBe('justo');
  });

  it('labels a −20%+ price as "excelente"', () => {
    // greatDeal threshold is 0.20 by default
    expect(calculatePriceIndicator(3900, similares).indicator).toBe('excelente');
  });

  it('labels a +20%+ price as "sobrevalorizado"', () => {
    expect(calculatePriceIndicator(6500, similares).indicator).toBe('sobrevalorizado');
  });

  it('reports the deviation as a signed ratio around the median', () => {
    const r = calculatePriceIndicator(5500, similares);
    // Median is ~5000, so ~+10% deviation
    expect(r.deviation).toBeCloseTo(0.10, 1);
  });

  it('returns "indisponivel" defensively when the median is 0', () => {
    // Feed strictly positive prices so calculateMarketStats accepts them, but
    // wire the median to 0 by making all samples identical to 1 — trimming
    // keeps them, and the guard triggers on `preco <= 0` when we pass 0.
    const flatMedianZero = Array.from({ length: 6 }).map((_, i) =>
      carro({ id: `z${i}`, marca: 'VW', modelo: 'Golf IV', preco: 1000, anoFabricacao: 2003 }),
    );
    const r = calculatePriceIndicator(0, flatMedianZero);
    expect(r.indicator).toBe('indisponivel');
  });
});

describe('indexCarrosByMarca', () => {
  const golf = carro({ id: 'g', marca: 'VW', modelo: 'Golf', preco: 5000, anoFabricacao: 2005 });
  const polo = carro({ id: 'p', marca: 'VW', modelo: 'Polo', preco: 3000, anoFabricacao: 2005 });
  const clio = carro({ id: 'c', marca: 'Renault', modelo: 'Clio', preco: 2000, anoFabricacao: 2005 });
  const all = [golf, polo, clio];

  it('groups cars by normalized brand', () => {
    const idx = indexCarrosByMarca(all);
    expect(idx.get('vw')).toEqual([golf, polo]);
    expect(idx.get('renault')).toEqual([clio]);
  });

  it('memoizes by array reference — repeated calls return the same Map', () => {
    // Justification for the WeakMap cache: on the home page,
    // usePriceIndicator runs once per CarCard against the same `carros`
    // array. The cache turns O(cards × cars) into O(cars) per render.
    const idx1 = indexCarrosByMarca(all);
    const idx2 = indexCarrosByMarca(all);
    expect(idx2).toBe(idx1);
  });
});

describe('filtrarCarrosSimilares', () => {
  const target = { marca: 'VW', modelo: 'Golf IV', ano: 2003 };
  const same = carro({ id: 's1', marca: 'VW', modelo: 'Golf IV 1.9 TDI', preco: 5000, anoFabricacao: 2003 });
  const nearYear = carro({ id: 's2', marca: 'VW', modelo: 'Golf IV', preco: 4800, anoFabricacao: 2005 });
  const farYear = carro({ id: 's3', marca: 'VW', modelo: 'Golf IV', preco: 4800, anoFabricacao: 2010 });
  const differentGen = carro({ id: 's4', marca: 'VW', modelo: 'Golf VII', preco: 12000, anoFabricacao: 2003 });
  const differentBrand = carro({ id: 's5', marca: 'Renault', modelo: 'Clio', preco: 4000, anoFabricacao: 2003 });

  it('keeps same-brand, same-model, within-year-range cars', () => {
    expect(filtrarCarrosSimilares([same, nearYear, differentBrand], target).map((c) => c.id)).toEqual([
      's1',
      's2',
    ]);
  });

  it('drops cars outside the year range', () => {
    expect(filtrarCarrosSimilares([farYear], target)).toEqual([]);
  });

  it('drops different generations of the same nameplate', () => {
    expect(filtrarCarrosSimilares([differentGen], target)).toEqual([]);
  });

  it('honours excludeId (for detail-page self-exclusion)', () => {
    expect(filtrarCarrosSimilares([same, nearYear], { ...target, excludeId: 's1' }).map((c) => c.id)).toEqual([
      's2',
    ]);
  });

  it('returns empty when marca or modelo is missing', () => {
    expect(filtrarCarrosSimilares([same], { marca: '', modelo: 'Golf' })).toEqual([]);
    expect(filtrarCarrosSimilares([same], { marca: 'VW', modelo: '' })).toEqual([]);
  });

  it('excludes "Para peças" (parts-only, non-running) listings from comparables', () => {
    // A wrecked car sold for parts is not a market comp for a running one of
    // the same model — including it would drag the median toward salvage
    // prices instead of actual asking prices.
    const forParts = carro({
      id: 's6',
      marca: 'VW',
      modelo: 'Golf IV',
      preco: 300,
      anoFabricacao: 2003,
      condition: 'Para peças',
    });
    expect(filtrarCarrosSimilares([same, forParts], target).map((c) => c.id)).toEqual(['s1']);
  });
});

describe('calculatePriceEstimate', () => {
  const marca = 'VW';
  const modelo = 'Golf IV';
  const sample: Carro[] = [4700, 4800, 4900, 5000, 5100, 5200, 5300].map((preco, i) =>
    carro({
      id: `g${i}`,
      marca,
      modelo,
      preco,
      km: 200_000,
      anoFabricacao: 2003,
      combustivel: 'Diesel',
    }),
  );

  it('returns zeros when no similar cars exist', () => {
    const r = calculatePriceEstimate({ marca: 'Ferrari', modelo: 'F40', ano: 1990 }, sample);
    expect(r.estimate).toBe(0);
    expect(r.rangeMin).toBe(0);
    expect(r.rangeMax).toBe(0);
    expect(r.sampleSize).toBe(0);
  });

  it('anchors the estimate on the sample median when km matches the average', () => {
    const r = calculatePriceEstimate({ marca, modelo, ano: 2003, km: 200_000 }, sample);
    // 7 samples → confidence 'media' (>=5, <10). Median is 5000.
    expect(r.confidence).toBe('media');
    expect(r.estimate).toBeGreaterThanOrEqual(4900);
    expect(r.estimate).toBeLessThanOrEqual(5100);
    expect(r.rangeMin).toBeLessThan(r.rangeMax);
  });

  it('lowers the estimate for a higher-mileage car', () => {
    const base = calculatePriceEstimate({ marca, modelo, ano: 2003, km: 200_000 }, sample);
    const highKm = calculatePriceEstimate(
      { marca, modelo, ano: 2003, km: 300_000, combustivel: 'Diesel' },
      sample,
    );
    expect(highKm.estimate).toBeLessThan(base.estimate);
  });

  it('never drops below 30% of the sample minimum (piso)', () => {
    // Absurdly high km should not send the estimate negative
    const r = calculatePriceEstimate(
      { marca, modelo, ano: 2003, km: 10_000_000, combustivel: 'Diesel' },
      sample,
    );
    const piso = Math.round(4700 * 0.3);
    expect(r.estimate).toBeGreaterThanOrEqual(piso - 1);
  });

  it('confidence tier scales with sample size', () => {
    const smallSample = sample.slice(0, 4);
    const smallResult = calculatePriceEstimate({ marca, modelo, ano: 2003 }, smallSample);
    expect(smallResult.confidence).toBe('baixa');

    // Grow to 10+ to hit 'alta'
    const big = [
      ...sample,
      carro({ id: 'x1', marca, modelo, preco: 4950, anoFabricacao: 2003, km: 200_000 }),
      carro({ id: 'x2', marca, modelo, preco: 5050, anoFabricacao: 2003, km: 200_000 }),
      carro({ id: 'x3', marca, modelo, preco: 5150, anoFabricacao: 2003, km: 200_000 }),
    ];
    expect(calculatePriceEstimate({ marca, modelo, ano: 2003 }, big).confidence).toBe('alta');
  });
});

describe('calculatePriceEstimate — fuel-aware km adjustment', () => {
  // Two cars, same everything except fuel: the km delta should hit them
  // differently. Petrol depreciates faster per km than diesel per the
  // KM_DEPRECIATION table in priceUtils.
  const marca = 'VW';
  const modelo = 'Golf IV';
  const baseKm = 200_000;
  const sample = (fuel: 'Diesel' | 'Gasolina') =>
    [4700, 4800, 4900, 5000, 5100, 5200, 5300].map((preco, i) =>
      carro({
        id: `${fuel}-${i}`,
        marca,
        modelo,
        preco,
        km: baseKm,
        anoFabricacao: 2003,
        combustivel: fuel,
      }),
    );

  it('penalizes gasolina more than diesel for the same extra km', () => {
    const dieselDelta =
      calculatePriceEstimate({ marca, modelo, ano: 2003, km: 300_000, combustivel: 'Diesel' }, sample('Diesel'))
        .estimate;
    const gasolinaDelta =
      calculatePriceEstimate({ marca, modelo, ano: 2003, km: 300_000, combustivel: 'Gasolina' }, sample('Gasolina'))
        .estimate;
    expect(gasolinaDelta).toBeLessThan(dieselDelta);
  });

  it('is bounded above by 120% of the sample max even when km is very low', () => {
    // Very low km should raise the estimate, but not blow past the ceiling
    const r = calculatePriceEstimate(
      { marca, modelo, ano: 2003, km: 1, combustivel: 'Diesel' },
      sample('Diesel'),
    );
    expect(r.estimate).toBeLessThanOrEqual(Math.ceil(5300 * 1.2));
  });
});

// Regression guard for a common trap: the old filter used the leading token
// of the model, so "A Class" would match anything starting with "a".
describe('isSameModel — regression: single-letter model names', () => {
  it('does not match A-Class with A4', () => {
    expect(isSameModel('A Class', 'A4')).toBe(false);
  });

  it('matches Class A with itself', () => {
    expect(isSameModel('Class A', 'Class A 180')).toBe(true);
  });
});

describe('priceDistributionBuckets', () => {
  it('returns [] for empty input', () => {
    expect(priceDistributionBuckets([])).toEqual([]);
  });

  it('collapses to a single bucket when all values are equal', () => {
    const b = priceDistributionBuckets([500, 500, 500]);
    expect(b).toHaveLength(1);
    expect(b[0].count).toBe(3);
  });

  it('distributes values across the requested number of buckets', () => {
    const b = priceDistributionBuckets([100, 200, 300, 400, 500, 600, 700, 800], 4);
    expect(b).toHaveLength(4);
    const total = b.reduce((s, bucket) => s + bucket.count, 0);
    expect(total).toBe(8);
    // The very last value must land in the last bucket (edge-case: floor(1))
    expect(b[b.length - 1].count).toBeGreaterThan(0);
  });
});
