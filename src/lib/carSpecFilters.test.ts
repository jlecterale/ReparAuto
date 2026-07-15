import { matchesCarSpecFilters } from '@/lib/carSpecFilters';
import type { Carro } from '@/types/carro';

// The spec filters cover the new listing attributes (category, condition, fuel,
// transmission, seats, traction, equipment). They are pure predicates so the
// home-page filtering stays testable in isolation from Firestore.
function makeCarro(overrides: Partial<Carro> = {}): Carro {
  return {
    id: '1',
    marca: 'Renault',
    modelo: 'Clio',
    anoFabricacao: 2015,
    preco: 8000,
    km: 90000,
    combustivel: 'Gasolina',
    cambio: 'Manual',
    cor: 'Cinzento',
    portas: 5,
    bodyType: 'Citadino',
    seats: 5,
    condition: 'Usado',
    traction: 'Dianteira',
    features: ['Ar condicionado', 'Bluetooth'],
    local: 'Lisboa',
    descricao: '',
    estadoVeiculo: 'pronto',
    tiposManutencao: [],
    fotos: [],
    criador: 'a@b.com',
    status: 'aprovado',
    dataCriacao: { seconds: 0, nanoseconds: 0 } as unknown as Carro['dataCriacao'],
    ...overrides,
  };
}

describe('matchesCarSpecFilters', () => {
  it('returns true when no criteria are set', () => {
    expect(matchesCarSpecFilters(makeCarro(), {})).toBe(true);
  });

  it('matches by body type and rejects a mismatch', () => {
    expect(matchesCarSpecFilters(makeCarro({ bodyType: 'SUV' }), { bodyType: 'SUV' })).toBe(true);
    expect(matchesCarSpecFilters(makeCarro({ bodyType: 'Citadino' }), { bodyType: 'SUV' })).toBe(false);
  });

  it('matches by condition', () => {
    expect(matchesCarSpecFilters(makeCarro({ condition: 'Novo' }), { condition: 'Novo' })).toBe(true);
    expect(matchesCarSpecFilters(makeCarro({ condition: 'Usado' }), { condition: 'Novo' })).toBe(false);
  });

  it('matches by fuel and transmission', () => {
    expect(matchesCarSpecFilters(makeCarro(), { combustivel: 'Gasolina' })).toBe(true);
    expect(matchesCarSpecFilters(makeCarro(), { combustivel: 'Diesel' })).toBe(false);
    expect(matchesCarSpecFilters(makeCarro(), { cambio: 'Automático' })).toBe(false);
  });

  it('treats seatsMin as a minimum (>=)', () => {
    expect(matchesCarSpecFilters(makeCarro({ seats: 7 }), { seatsMin: 7 })).toBe(true);
    expect(matchesCarSpecFilters(makeCarro({ seats: 5 }), { seatsMin: 7 })).toBe(false);
  });

  it('excludes cars with no seats value when a seatsMin is required', () => {
    expect(matchesCarSpecFilters(makeCarro({ seats: undefined }), { seatsMin: 5 })).toBe(false);
  });

  it('matches by traction', () => {
    expect(matchesCarSpecFilters(makeCarro({ traction: 'Integral (4x4)' }), { traction: 'Integral (4x4)' })).toBe(true);
    expect(matchesCarSpecFilters(makeCarro({ traction: 'Dianteira' }), { traction: 'Integral (4x4)' })).toBe(false);
  });

  it('requires ALL selected features to be present', () => {
    const carro = makeCarro({ features: ['Ar condicionado', 'Bluetooth', 'GPS / Navegação'] });
    expect(matchesCarSpecFilters(carro, { features: ['Ar condicionado', 'GPS / Navegação'] })).toBe(true);
    expect(matchesCarSpecFilters(carro, { features: ['Teto de abrir'] })).toBe(false);
  });

  it('rejects when a feature is required but the car has none', () => {
    expect(matchesCarSpecFilters(makeCarro({ features: undefined }), { features: ['Bluetooth'] })).toBe(false);
  });

  it('ignores empty-string and empty-array criteria', () => {
    expect(matchesCarSpecFilters(makeCarro(), { bodyType: '', condition: '', features: [] })).toBe(true);
  });
});
