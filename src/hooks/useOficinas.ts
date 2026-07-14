'use client';

import { useState, useEffect, useMemo } from 'react';
import { subscribeOficinas } from '@/lib/db';
import { filterByCountry } from '@/lib/country';
import { useCountry } from '@/providers/CountryProvider';
import type { OficinaMecanico } from '@/types/oficina';

export interface OficinasContextValue {
  oficinas: OficinaMecanico[];
  loading: boolean;
}

export default function useOficinas(active: boolean = true): OficinasContextValue {
  const { country } = useCountry();
  const [allOficinas, setOficinas] = useState<OficinaMecanico[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!active) return;
    const unsub = subscribeOficinas(
      (data) => {
        setOficinas(data);
        setLoading(false);
      },
      (err) => {
        console.error('[useOficinas] Erro:', err);
        setLoading(false);
      }
    );
    return unsub;
  }, [active]);

  // Market isolation (plan 20): legacy docs without a country resolve to PT.
  const oficinas = useMemo(() => filterByCountry(allOficinas, country), [allOficinas, country]);

  return useMemo(() => ({ oficinas, loading }), [oficinas, loading]);
}
