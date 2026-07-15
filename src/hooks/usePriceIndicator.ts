'use client';

import { useMemo } from 'react';
import { useApp } from '@/providers/AppProvider';
import {
  calculatePriceIndicator,
  filtrarCarrosSimilares,
} from '@/lib/priceUtils';
import { docCountry } from '@/lib/country';
import type { Carro } from '@/types/carro';
import type { PriceIndicatorResult } from '@/types/preco';

export default function usePriceIndicator(carro: Carro | null): PriceIndicatorResult {
  const { carros } = useApp();

  return useMemo(() => {
    if (!carro) {
      return { indicator: 'indisponivel', deviation: 0, stats: null, sampleSize: 0 };
    }
    // A "Para peças" listing is priced against a market of non-running cars,
    // not the working-car median we compare it to — it would otherwise always
    // read as an "excelente" deal, which is misleading on a wreck/parts ad.
    if (carro.condition === 'Para peças') {
      return { indicator: 'indisponivel', deviation: 0, stats: null, sampleSize: 0 };
    }
    const similares = filtrarCarrosSimilares(carros.carros, {
      marca: carro.marca,
      modelo: carro.modelo,
      ano: carro.anoFabricacao,
      excludeId: carro.id,
      // carros.carros is scoped to the viewer's active market; a listing from
      // the other market (reachable via direct link) must not be compared
      // against it — EUR and BRL prices would mix as plain numbers.
      country: docCountry(carro),
    });
    return calculatePriceIndicator(carro.preco, similares);
  }, [carro, carros.carros]);
}
