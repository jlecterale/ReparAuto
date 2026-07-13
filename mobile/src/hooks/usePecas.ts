import { useEffect, useMemo, useState } from 'react';
import { subscribePecas } from '@/lib/db';
import { filterByCountry } from '@/lib/country';
import { useCountry } from '@/context/CountryContext';
import type { Peca } from '@/types';

/** Live subscription to approved parts (mirrors the web `usePecas`). */
export function usePecas() {
  const { country } = useCountry();
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsub = subscribePecas(
      (data) => {
        setPecas(data);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  // The subscription is market-agnostic (rules only allow the status filter);
  // the active market is applied in memory, like the web.
  const filtered = useMemo(() => filterByCountry(pecas, country), [pecas, country]);

  return { pecas: filtered, loading, error };
}
