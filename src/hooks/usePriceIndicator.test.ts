import { renderHook } from '@testing-library/react';
import usePriceIndicator from '@/hooks/usePriceIndicator';
import type { Carro } from '@/types/carro';

// The hook reads `useApp().carros.carros`; mocking the whole provider keeps
// the test focused on the price-derivation glue rather than context wiring.
const mockCarrosRef: { list: Carro[] } = { list: [] };
jest.mock('../providers/AppProvider', () => ({
  useApp: () => ({ carros: { carros: mockCarrosRef.list } }),
}));

function carro(overrides: Partial<Carro> & { id: string; marca: string; modelo: string; preco: number; anoFabricacao: number }): Carro {
  return {
    km: 0,
    combustivel: 'Diesel',
    cambio: 'Manual',
    cor: 'Preto',
    portas: 5,
    local: 'Lisboa',
    descricao: '',
    estadoVeiculo: 'pronto',
    tiposManutencao: [],
    fotos: [],
    criador: 'a@b.pt',
    status: 'aprovado',
    dataCriacao: { toMillis: () => 0, toDate: () => new Date(0) } as unknown as Carro['dataCriacao'],
    ...overrides,
  } as Carro;
}

describe('usePriceIndicator', () => {
  it('returns "indisponivel" for a null car', () => {
    mockCarrosRef.list = [];
    const { result } = renderHook(() => usePriceIndicator(null));
    expect(result.current.indicator).toBe('indisponivel');
    expect(result.current.sampleSize).toBe(0);
  });

  it('excludes the target car itself from its own comparison sample', () => {
    // Six comparable cars + the target itself. Without excludeId, the target
    // would inflate the sample by 1 and its own price would drag the median.
    const target = carro({ id: 'me', marca: 'VW', modelo: 'Golf IV', preco: 8000, anoFabricacao: 2003 });
    mockCarrosRef.list = [
      target,
      ...[4700, 4800, 4900, 5000, 5100, 5200].map((p, i) =>
        carro({ id: `c${i}`, marca: 'VW', modelo: 'Golf IV', preco: p, anoFabricacao: 2003 }),
      ),
    ];

    const { result } = renderHook(() => usePriceIndicator(target));
    expect(result.current.sampleSize).toBe(6);
    // 8000 vs median ~5000 is far above → sobrevalorizado
    expect(result.current.indicator).toBe('sobrevalorizado');
  });

  it('memoizes on the same (car, list) reference — no recompute across renders', () => {
    const target = carro({ id: 'me', marca: 'VW', modelo: 'Golf IV', preco: 5000, anoFabricacao: 2003 });
    mockCarrosRef.list = [
      ...[4700, 4800, 4900, 5000, 5100, 5200].map((p, i) =>
        carro({ id: `c${i}`, marca: 'VW', modelo: 'Golf IV', preco: p, anoFabricacao: 2003 }),
      ),
    ];

    const { result, rerender } = renderHook(() => usePriceIndicator(target));
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
