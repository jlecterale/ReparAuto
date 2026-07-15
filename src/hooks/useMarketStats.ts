'use client';

import { useMemo } from 'react';
import { useApp } from '@/providers/AppProvider';
import { calculateMarketStats, isSameModel, normalizeMarca } from '@/lib/priceUtils';
import type { Carro } from '@/types/carro';
import type { MarketStats } from '@/types/preco';

export interface MarketStatsFilter {
  marca?: string;
  modelo?: string;
  combustivel?: string;
  distrito?: string;
  anoMin?: number;
  anoMax?: number;
}

export interface MarketStatsResult {
  stats: MarketStats | null;
  carros: Carro[];
  loading: boolean;
}

export default function useMarketStats(filter: MarketStatsFilter = {}): MarketStatsResult {
  const { carros } = useApp();

  return useMemo(() => {
    const marcaNorm = filter.marca ? normalizeMarca(filter.marca) : '';

    const filtrados = carros.carros.filter((c) => {
      // "Para peças" (parts-only, non-running) listings are a different
      // product — same reasoning as filtrarCarrosSimilares in priceUtils.ts.
      if (c.condition === 'Para peças') return false;
      if (marcaNorm && normalizeMarca(c.marca) !== marcaNorm) return false;
      if (filter.modelo && !isSameModel(filter.modelo, c.modelo)) return false;
      if (filter.combustivel && c.combustivel !== filter.combustivel) return false;
      if (filter.distrito && c.distrito !== filter.distrito && c.local !== filter.distrito) return false;
      if (filter.anoMin && c.anoFabricacao < filter.anoMin) return false;
      if (filter.anoMax && c.anoFabricacao > filter.anoMax) return false;
      return true;
    });

    const stats = calculateMarketStats(filtrados.map((c) => c.preco));
    return { stats, carros: filtrados, loading: carros.loading };
  }, [carros.carros, carros.loading, filter.marca, filter.modelo, filter.combustivel, filter.distrito, filter.anoMin, filter.anoMax]);
}
