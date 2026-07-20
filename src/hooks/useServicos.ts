'use client';

import { useState, useEffect, useMemo } from 'react';
import { subscribeOficinas } from '@/lib/db';
import { filterByCountry } from '@/lib/country';
import { useCountry } from '@/providers/CountryProvider';
import type { OficinaMecanico } from '@/types/oficina';

export interface ServicosContextValue {
  todosServicos: OficinaMecanico[];
  oficinas: OficinaMecanico[];
  guinchos: OficinaMecanico[];
  borracharias: OficinaMecanico[];
  loading: boolean;
}

export default function useServicos(active: boolean = true): ServicosContextValue {
  const { country } = useCountry();
  const [allServicos, setServicos] = useState<OficinaMecanico[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!active) return;
    // subscribeOficinas listens to the whole 'services' collection
    const unsub = subscribeOficinas(
      (data) => {
        setServicos(data);
        setLoading(false);
      },
      (err) => {
        console.error('[useServicos] Erro:', err);
        setLoading(false);
      }
    );
    return unsub;
  }, [active]);

  // Filter by country
  const todosServicos = useMemo(() => filterByCountry(allServicos, country), [allServicos, country]);

  // Split by serviceType
  const oficinas = useMemo(() => 
    todosServicos.filter((s) => !s.serviceType || s.serviceType === 'workshop'),
    [todosServicos]
  );

  const guinchos = useMemo(() => 
    todosServicos.filter((s) => s.serviceType === 'towing'),
    [todosServicos]
  );

  const borracharias = useMemo(() => 
    todosServicos.filter((s) => s.serviceType === 'tire_repair'),
    [todosServicos]
  );

  return useMemo(() => ({
    todosServicos,
    oficinas,
    guinchos,
    borracharias,
    loading
  }), [todosServicos, oficinas, guinchos, borracharias, loading]);
}
