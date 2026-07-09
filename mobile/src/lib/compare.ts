/**
 * Pure logic for the side-by-side vehicle comparison. Ported 1:1 from the
 * web `src/lib/compare.ts`, where the logic is unit-tested.
 */

import { formatKm, formatPreco } from '@/lib/format';
import type { Carro } from '@/types';

export const MAX_COMPARE = 3;

/** Adds/removes an id from the selection, refusing to grow past MAX_COMPARE. */
export function toggleCompareId(ids: readonly string[], id: string): string[] {
  if (ids.includes(id)) return ids.filter((existing) => existing !== id);
  if (ids.length >= MAX_COMPARE) return [...ids];
  return [...ids, id];
}

export interface CompareRow {
  label: string;
  values: string[];
  /** Column indices holding the best value; empty when tied or not scored. */
  bestIndices: number[];
}

const PLACEHOLDER = '—';

// Returns the indices holding the winning numeric value, or [] on a tie /
// when fewer than two cars have the number at all.
function bestOf(values: (number | undefined)[], direction: 'min' | 'max'): number[] {
  const defined = values.filter((v): v is number => typeof v === 'number');
  if (defined.length < 2) return [];
  const target = direction === 'min' ? Math.min(...defined) : Math.max(...defined);
  if (defined.every((v) => v === target)) return [];
  return values.flatMap((v, i) => (v === target ? [i] : []));
}

const simNao = (value: boolean | undefined): string =>
  value === undefined ? PLACEHOLDER : value ? 'Sim' : 'Não';

export function buildCompareRows(carros: readonly Carro[]): CompareRow[] {
  const numericRow = (
    label: string,
    pick: (c: Carro) => number | undefined,
    format: (v: number) => string,
    direction: 'min' | 'max',
  ): CompareRow => {
    const raw = carros.map(pick);
    return {
      label,
      values: raw.map((v) => (typeof v === 'number' ? format(v) : PLACEHOLDER)),
      bestIndices: bestOf(raw, direction),
    };
  };

  const textRow = (label: string, pick: (c: Carro) => string | undefined): CompareRow => ({
    label,
    values: carros.map((c) => pick(c) || PLACEHOLDER),
    bestIndices: [],
  });

  return [
    numericRow('Preço', (c) => c.preco, (v) => formatPreco(v), 'min'),
    numericRow('Ano', (c) => c.anoFabricacao, (v) => String(v), 'max'),
    numericRow('Quilómetros', (c) => c.km, (v) => formatKm(v), 'min'),
    numericRow('Potência', (c) => c.power, (v) => `${v} cv`, 'max'),
    textRow('Combustível', (c) => c.combustivel),
    textRow('Caixa', (c) => c.cambio),
    textRow('Carroçaria', (c) => c.bodyType),
    numericRow('Portas', (c) => c.portas, (v) => String(v), 'max'),
    numericRow('Lugares', (c) => c.seats, (v) => String(v), 'max'),
    textRow('Cor', (c) => c.cor),
    textRow('Estado', (c) =>
      c.estadoVeiculo === 'pronto' ? 'Pronto para rodar' : 'Precisa de manutenção',
    ),
    textRow('Manutenções necessárias', (c) =>
      c.estadoVeiculo === 'manutencao' && c.tiposManutencao.length > 0
        ? c.tiposManutencao.join(', ')
        : undefined,
    ),
    textRow('A rodar', (c) => (c.estadoVeiculo === 'manutencao' ? simNao(c.rodando) : undefined)),
    textRow('Inspeção válida', (c) => simNao(c.inspecao)),
    textRow('Localização', (c) => c.local),
  ];
}
