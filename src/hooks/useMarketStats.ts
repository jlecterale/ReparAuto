'use client';

import { useMemo } from 'react';
import { useApp } from '@/providers/AppProvider';
import { calculateMarketStats, normalizeMarca, normalizeModelo } from '@/lib/priceUtils';
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
    const modeloNorm = filter.modelo ? normalizeModelo(filter.modelo) : '';

    const filtrados = carros.carros.filter((c) => {
      if (marcaNorm && normalizeMarca(c.marca) !== marcaNorm) return false;
      if (modeloNorm) {
        const token = modeloNorm.split(' ')[0];
        if (!normalizeModelo(c.modelo).includes(token)) return false;
      }
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
