'use client';

import { useState, useEffect, useMemo } from 'react';
import { subscribeOficinas } from '@/lib/db';
import type { OficinaMecanico } from '@/types/oficina';

export interface OficinasContextValue {
  oficinas: OficinaMecanico[];
  loading: boolean;
}

export default function useOficinas(active: boolean = true): OficinasContextValue {
  const [oficinas, setOficinas] = useState<OficinaMecanico[]>([]);
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

  return useMemo(() => ({ oficinas, loading }), [oficinas, loading]);
}
