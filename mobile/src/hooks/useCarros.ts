import { useEffect, useState } from 'react';
import { subscribeCarros } from '@/lib/db';
import type { Carro } from '@/types';

/** Live subscription to approved cars (mirrors the web `useCarros`). */
export function useCarros() {
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

  return { carros, loading, error };
}
