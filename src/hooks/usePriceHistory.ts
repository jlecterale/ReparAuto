'use client';

import { useEffect, useState } from 'react';
import { getPriceSnapshots } from '@/lib/db';
import type { PriceSnapshot } from '@/types/preco';
import type { Country } from '@/lib/country';

export default function usePriceHistory(marca: string | null, modelo: string | null, country: Country) {
  const [snapshots, setSnapshots] = useState<PriceSnapshot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!marca || !modelo) {
      setSnapshots([]);
      return;
    }
    setLoading(true);
    getPriceSnapshots(marca, modelo, country)
      .then((data) => {
        if (!cancelled) setSnapshots(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [marca, modelo, country]);

  return { snapshots, loading };
}
