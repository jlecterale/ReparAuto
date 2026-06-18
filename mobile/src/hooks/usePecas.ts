import { useEffect, useState } from 'react';
import { subscribePecas } from '@/lib/db';
import type { Peca } from '@/types';

/** Live subscription to approved parts (mirrors the web `usePecas`). */
export function usePecas() {
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

  return { pecas, loading, error };
}
