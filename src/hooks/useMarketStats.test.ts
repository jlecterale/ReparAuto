import { renderHook } from '@testing-library/react';
import useMarketStats from '@/hooks/useMarketStats';
import type { Carro } from '@/types/carro';

// The hook reads `useApp().carros.{carros,loading}`; mocking the whole
// provider keeps the test focused on the filtering/stats glue.
const mockCarrosRef: { list: Carro[]; loading: boolean } = { list: [], loading: false };
jest.mock('../providers/AppProvider', () => ({
  useApp: () => ({ carros: { carros: mockCarrosRef.list, loading: mockCarrosRef.loading } }),
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

beforeEach(() => {
  mockCarrosRef.list = [];
  mockCarrosRef.loading = false;
});

describe('useMarketStats', () => {
  it('returns null stats and an empty list when there are no cars', () => {
    const { result } = renderHook(() => useMarketStats());
    expect(result.current.stats).toBeNull();
    expect(result.current.carros).toEqual([]);
  });

  it('filters by marca and modelo', () => {
    mockCarrosRef.list = [
      carro({ id: '1', marca: 'VW', modelo: 'Golf IV', preco: 5000, anoFabricacao: 2003 }),
      carro({ id: '2', marca: 'VW', modelo: 'Polo', preco: 3000, anoFabricacao: 2003 }),
      carro({ id: '3', marca: 'Renault', modelo: 'Clio', preco: 2000, anoFabricacao: 2003 }),
    ];
    const { result } = renderHook(() => useMarketStats({ marca: 'VW', modelo: 'Golf' }));
    expect(result.current.carros.map((c) => c.id)).toEqual(['1']);
  });

  it('filters by combustivel, distrito and year range', () => {
    mockCarrosRef.list = [
      carro({ id: '1', marca: 'VW', modelo: 'Golf', preco: 5000, anoFabricacao: 2003, combustivel: 'Diesel', distrito: 'Lisboa' }),
      carro({ id: '2', marca: 'VW', modelo: 'Golf', preco: 5000, anoFabricacao: 2003, combustivel: 'Gasolina', distrito: 'Lisboa' }),
      carro({ id: '3', marca: 'VW', modelo: 'Golf', preco: 5000, anoFabricacao: 2010, combustivel: 'Diesel', distrito: 'Lisboa' }),
      carro({ id: '4', marca: 'VW', modelo: 'Golf', preco: 5000, anoFabricacao: 2003, combustivel: 'Diesel', distrito: 'Porto', local: 'Porto' }),
    ];
    const { result } = renderHook(() =>
      useMarketStats({ combustivel: 'Diesel', distrito: 'Lisboa', anoMin: 2000, anoMax: 2005 }),
    );
    expect(result.current.carros.map((c) => c.id)).toEqual(['1']);
  });

  it('excludes "Para peças" listings from the dashboard stats', () => {
    // Same reasoning as filtrarCarrosSimilares / usePriceIndicator: a
    // parts-only wreck is not a market comp and would skew the median.
    mockCarrosRef.list = [
      carro({ id: '1', marca: 'VW', modelo: 'Golf', preco: 5000, anoFabricacao: 2003 }),
      carro({ id: '2', marca: 'VW', modelo: 'Golf', preco: 300, anoFabricacao: 2003, condition: 'Para peças' }),
    ];
    const { result } = renderHook(() => useMarketStats({ marca: 'VW', modelo: 'Golf' }));
    expect(result.current.carros.map((c) => c.id)).toEqual(['1']);
    expect(result.current.stats?.count).toBe(1);
  });

  it('passes through the loading flag from useApp', () => {
    mockCarrosRef.loading = true;
    const { result } = renderHook(() => useMarketStats());
    expect(result.current.loading).toBe(true);
  });
});
