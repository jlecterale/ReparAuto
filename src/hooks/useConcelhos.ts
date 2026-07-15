'use client';

import { useState, useEffect } from 'react';
import { getConcelhos } from '@/lib/geo';
import { fetchBrCities } from '@/lib/ibge';
import { useCountry } from '@/providers/CountryProvider';

/**
 * City list for the selected region (concelhos in PT, municípios in BR),
 * resolved for the active market. PT is synchronous from the bundled dataset;
 * BR loads the full IBGE municipality list for the state on demand (cached).
 */
export function useConcelhos(distrito: string): { concelhos: string[]; loading: boolean } {
  const { country } = useCountry();
  const [brCidades, setBrCidades] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (country !== 'BR' || !distrito) {
      setBrCidades([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchBrCities(distrito)
      .then((cidades) => { if (!cancelled) setBrCidades(cidades); })
      .catch((err) => {
        console.warn('[useConcelhos] Erro ao carregar municípios IBGE:', err);
        if (!cancelled) setBrCidades([]);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [country, distrito]);

  if (country === 'BR') return { concelhos: brCidades, loading };
  return { concelhos: getConcelhos(distrito, 'PT').map((c) => c.nome), loading: false };
}
