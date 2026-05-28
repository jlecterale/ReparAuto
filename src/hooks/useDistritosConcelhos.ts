import { useMemo } from 'react';
import { DISTRITOS, getConcelhos } from '@/lib/geo';
import type { ConcelhoDado } from '@/lib/geo';

export function useDistritosConcelhos() {
  const distritos = useMemo(() => DISTRITOS, []);

  const getConcelhosDoDistrito = (distrito: string): ConcelhoDado[] =>
    getConcelhos(distrito);

  return { distritos, getConcelhos: getConcelhosDoDistrito };
}
