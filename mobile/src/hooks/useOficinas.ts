import { useEffect, useMemo, useState } from 'react';
import { subscribeOficinas } from '@/lib/db';
import { filterByCountry } from '@/lib/country';
import { useCountry } from '@/context/CountryContext';
import type { Oficina } from '@/types';

/** Live subscription to approved workshops (mirrors the web `useOficinas`). */
export function useOficinas() {
  const { country } = useCountry();
  const [oficinas, setOficinas] = useState<Oficina[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsub = subscribeOficinas(
      (data) => {
        setOficinas(data);
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
  const filtered = useMemo(() => filterByCountry(oficinas, country), [oficinas, country]);

  return { oficinas: filtered, loading, error };
}
