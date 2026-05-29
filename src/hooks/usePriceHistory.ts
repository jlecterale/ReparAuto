'use client';

import { useEffect, useState } from 'react';
import { getPriceSnapshots } from '@/lib/db';
import type { PriceSnapshot } from '@/types/preco';

export default function usePriceHistory(marca: string | null, modelo: string | null) {
  const [snapshots, setSnapshots] = useState<PriceSnapshot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!marca || !modelo) {
      setSnapshots([]);
      return;
    }
    setLoading(true);
    getPriceSnapshots(marca, modelo)
      .then((data) => {
        if (!cancelled) setSnapshots(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [marca, modelo]);

  return { snapshots, loading };
}
