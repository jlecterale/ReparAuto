'use client';

import { useMemo } from 'react';
import { useApp } from '@/providers/AppProvider';
import {
  calculatePriceIndicator,
  filtrarCarrosSimilares,
} from '@/lib/priceUtils';
import type { Carro } from '@/types/carro';
import type { PriceIndicatorResult } from '@/types/preco';

export default function usePriceIndicator(carro: Carro | null): PriceIndicatorResult {
  const { carros } = useApp();

  return useMemo(() => {
    if (!carro) {
      return { indicator: 'indisponivel', deviation: 0, stats: null, sampleSize: 0 };
    }
    const similares = filtrarCarrosSimilares(carros.carros, {
      marca: carro.marca,
      modelo: carro.modelo,
      ano: carro.anoFabricacao,
      excludeId: carro.id,
    });
    return calculatePriceIndicator(carro.preco, similares);
  }, [carro, carros.carros]);
}
