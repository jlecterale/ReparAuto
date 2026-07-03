import { MAX_COMPARE, toggleCompareId, buildCompareRows } from '@/lib/compare';
import type { Carro } from '@/types/carro';

const carro = (overrides: Partial<Carro>): Carro =>
  ({
    id: 'c1',
    marca: 'VW',
    modelo: 'Golf',
    anoFabricacao: 2015,
    preco: 5000,
    km: 120000,
    combustivel: 'Diesel',
    cambio: 'Manual',
    cor: 'Preto',
    portas: 5,
    local: 'Lisboa',
    descricao: '',
    estadoVeiculo: 'pronto',
    tiposManutencao: [],
    fotos: [],
    criador: 'a@b.c',
    status: 'aprovado',
    ...overrides,
  }) as Carro;

describe('toggleCompareId', () => {
  it('adds an id that is not selected yet', () => {
    expect(toggleCompareId([], 'a')).toEqual(['a']);
    expect(toggleCompareId(['a'], 'b')).toEqual(['a', 'b']);
  });

  it('removes an id that is already selected', () => {
    expect(toggleCompareId(['a', 'b'], 'a')).toEqual(['b']);
  });

  it('refuses to grow beyond MAX_COMPARE', () => {
    const full = ['a', 'b', 'c'];
    expect(full).toHaveLength(MAX_COMPARE);
    expect(toggleCompareId(full, 'd')).toEqual(full);
  });

  it('still allows removing when full', () => {
    expect(toggleCompareId(['a', 'b', 'c'], 'b')).toEqual(['a', 'c']);
  });
});

describe('buildCompareRows', () => {
  const barato = carro({ id: 'c1', preco: 3000, km: 200000, anoFabricacao: 2010 });
  const caro = carro({ id: 'c2', preco: 8000, km: 90000, anoFabricacao: 2018, estadoVeiculo: 'manutencao', tiposManutencao: ['Mecânica', 'Pintura e funilaria'] });

  const rowByLabel = (label: string) => {
    const row = buildCompareRows([barato, caro]).find((r) => r.label === label);
    if (!row) throw new Error(`row ${label} not found`);
    return row;
  };

  it('marks the lowest price as best', () => {
    expect(rowByLabel('Preço').bestIndices).toEqual([0]);
  });

  it('marks the lowest mileage and newest year as best', () => {
    expect(rowByLabel('Quilómetros').bestIndices).toEqual([1]);
    expect(rowByLabel('Ano').bestIndices).toEqual([1]);
  });

  it('does not mark a best value when the values tie', () => {
    const rows = buildCompareRows([carro({ id: 'a', preco: 5000 }), carro({ id: 'b', preco: 5000 })]);
    const preco = rows.find((r) => r.label === 'Preço');
    expect(preco?.bestIndices).toEqual([]);
  });

  it('renders a placeholder for missing optional values', () => {
    expect(rowByLabel('Potência').values).toEqual(['—', '—']);
    expect(rowByLabel('Potência').bestIndices).toEqual([]);
  });

  it('describes the structured vehicle condition', () => {
    expect(rowByLabel('Estado').values[0]).toBe('Pronto para rodar');
    expect(rowByLabel('Estado').values[1]).toBe('Precisa de manutenção');
    expect(rowByLabel('Manutenções necessárias').values[1]).toBe('Mecânica, Pintura e funilaria');
    expect(rowByLabel('Manutenções necessárias').values[0]).toBe('—');
  });
});
