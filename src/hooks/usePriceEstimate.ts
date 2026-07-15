'use client';

import { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/providers/AppProvider';
import { calculatePriceEstimate } from '@/lib/priceUtils';
import type { PriceEstimate, PriceEstimateInput } from '@/types/preco';

const EMPTY: PriceEstimate = {
  estimate: 0,
  rangeMin: 0,
  rangeMax: 0,
  sampleSize: 0,
  confidence: 'baixa',
  stats: null,
};

export default function usePriceEstimate(input: PriceEstimateInput | null, debounceMs = 250): PriceEstimate {
  const { carros } = useApp();
  const [debounced, setDebounced] = useState<PriceEstimateInput | null>(input);

  // Every field that reaches calculatePriceEstimate must be in the dep list,
  // otherwise the debounced snapshot goes stale and the UI shows the wrong
  // estimate when the user only changes fuel or gearbox.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(input), debounceMs);
    return () => clearTimeout(t);
  }, [
    input?.marca,
    input?.modelo,
    input?.ano,
    input?.km,
    input?.combustivel,
    input?.cambio,
    input?.country,
    debounceMs,
  ]);

  return useMemo(() => {
    if (!debounced?.marca || !debounced?.modelo || !debounced?.ano) {
      return EMPTY;
    }
    return calculatePriceEstimate(debounced, carros.carros);
  }, [debounced, carros.carros]);
}
