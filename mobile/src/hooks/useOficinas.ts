import { useEffect, useState } from 'react';
import { subscribeOficinas } from '@/lib/db';
import type { Oficina } from '@/types';

/** Live subscription to approved workshops (mirrors the web `useOficinas`). */
export function useOficinas() {
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

  return { oficinas, loading, error };
}
