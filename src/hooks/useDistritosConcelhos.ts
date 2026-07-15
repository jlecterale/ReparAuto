'use client';

import { useMemo } from 'react';
import { getDistritos, getConcelhos } from '@/lib/geo';
import { useCountry } from '@/providers/CountryProvider';
import type { ConcelhoDado } from '@/lib/geo';

// Region pickers follow the active market: PT distritos/concelhos or BR
// estados/cidades (same data shape — see geo.ts).
export function useDistritosConcelhos() {
  const { country } = useCountry();
  const distritos = useMemo(() => getDistritos(country), [country]);

  const getConcelhosDoDistrito = (distrito: string): ConcelhoDado[] =>
    getConcelhos(distrito);

  return { distritos, getConcelhos: getConcelhosDoDistrito };
}
