import { useEffect, useMemo, useState } from 'react';
import { subscribeCarros } from '@/lib/db';
import { filterByCountry } from '@/lib/country';
import { useCountry } from '@/context/CountryContext';
import type { Carro } from '@/types';

/** Live subscription to approved cars (mirrors the web `useCarros`). */
export function useCarros() {
  const { country } = useCountry();
  const [carros, setCarros] = useState<Carro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsub = subscribeCarros(
      (data) => {
        setCarros(data);
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
  const filtered = useMemo(() => filterByCountry(carros, country), [carros, country]);

  return { carros: filtered, loading, error };
}
