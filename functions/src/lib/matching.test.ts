import { matchKeyword, matchCriteria, matchFilters, matchesSubscription } from './matching';

describe('matchKeyword', () => {
  const golf = { marca: 'Volkswagen', modelo: 'Golf GTI', descricao: 'Impecável, revisões na marca' };

  it('matches when every keyword token appears in the listing text', () => {
    expect(matchKeyword(golf, 'cars', 'golf gti')).toBe(true);
    expect(matchKeyword(golf, 'cars', 'volkswagen golf')).toBe(true);
  });

  it('does not match when a token is missing', () => {
    expect(matchKeyword(golf, 'cars', 'golf tdi')).toBe(false);
  });

  it('ignores case and accents on both sides', () => {
    expect(matchKeyword({ titulo: 'Retrovisor Mégane' }, 'parts', 'megane')).toBe(true);
    expect(matchKeyword(golf, 'cars', 'IMPECAVEL')).toBe(true);
  });

  it('restricts by categoria when the subscription sets one', () => {
    expect(matchKeyword(golf, 'cars', 'golf', 'carros')).toBe(true);
    expect(matchKeyword(golf, 'cars', 'golf', 'pecas')).toBe(false);
  });

  it('never matches an empty or too-short keyword', () => {
    expect(matchKeyword(golf, 'cars', '')).toBe(false);
    expect(matchKeyword(golf, 'cars', ' g ')).toBe(false);
  });
});

describe('matchCriteria', () => {
  it('requires the categoria to map to the listing collection', () => {
    expect(matchCriteria({}, 'cars', { categoria: 'carros' })).toBe(true);
    expect(matchCriteria({}, 'parts', { categoria: 'carros' })).toBe(false);
    expect(matchCriteria({}, 'services', { categoria: 'oficinas' })).toBe(true);
  });

  it('filters parts by tipoAnuncio (venda/desmonte/procura)', () => {
    const peca = { tipo: 'procura', titulo: 'Farol Clio' };
    expect(matchCriteria(peca, 'parts', { categoria: 'pecas', tipoAnuncio: 'procura' })).toBe(true);
    expect(matchCriteria(peca, 'parts', { categoria: 'pecas', tipoAnuncio: 'venda' })).toBe(false);
  });

  it('matches concelho against local or localidade, accent-insensitive', () => {
    expect(matchCriteria({ local: 'Águeda' }, 'cars', { categoria: 'carros', concelho: 'agueda' })).toBe(true);
    expect(matchCriteria({ localidade: 'Braga' }, 'services', { categoria: 'oficinas', concelho: 'Braga' })).toBe(true);
    expect(matchCriteria({ local: 'Porto' }, 'cars', { categoria: 'carros', concelho: 'Braga' })).toBe(false);
  });

  it('matches marca against marca or marcaCarro', () => {
    expect(matchCriteria({ marca: 'BMW' }, 'cars', { categoria: 'carros', marca: 'bmw' })).toBe(true);
    expect(matchCriteria({ marcaCarro: 'Renault' }, 'parts', { categoria: 'pecas', marca: 'renault' })).toBe(true);
    expect(matchCriteria({ marca: 'BMW' }, 'cars', { categoria: 'carros', marca: 'Audi' })).toBe(false);
  });

  it('rejects a missing or unknown categoria', () => {
    expect(matchCriteria({}, 'cars', {})).toBe(false);
    expect(matchCriteria({}, 'cars', { categoria: 'nope' })).toBe(false);
  });
});

describe('matchFilters', () => {
  const carro = {
    marca: 'Volkswagen',
    modelo: 'Golf',
    preco: 15000,
    anoFabricacao: 2018,
    km: 90000,
    combustivel: 'Diesel',
    cambio: 'Manual',
    cor: 'Preto',
    portas: 5,
    local: 'Porto',
    distrito: 'Porto',
    estadoVeiculo: 'pronto',
    rodando: true,
    inspecao: true,
    fotos: ['a.jpg', 'b.jpg'],
  };

  it('only applies to the cars collection', () => {
    expect(matchFilters(carro, 'parts', { marca: 'Volkswagen' })).toBe(false);
  });

  it('matches when every set filter passes', () => {
    expect(
      matchFilters(carro, 'cars', {
        marca: 'volkswagen',
        precoMin: 10000,
        precoMax: 20000,
        anoMin: 2015,
        kmMax: 100000,
        combustivel: 'Diesel',
        rodando: true,
        minFotos: 2,
      }),
    ).toBe(true);
  });

  it('fails when a range bound is violated', () => {
    expect(matchFilters(carro, 'cars', { precoMax: 10000 })).toBe(false);
    expect(matchFilters(carro, 'cars', { anoMax: 2017 })).toBe(false);
    expect(matchFilters(carro, 'cars', { kmMin: 100000 })).toBe(false);
    expect(matchFilters(carro, 'cars', { minFotos: 3 })).toBe(false);
  });

  it('matches free text tokens against the listing text', () => {
    expect(matchFilters(carro, 'cars', { texto: 'golf' })).toBe(true);
    expect(matchFilters(carro, 'cars', { texto: 'polo' })).toBe(false);
  });

  it('never matches an empty filter object', () => {
    expect(matchFilters(carro, 'cars', {})).toBe(false);
  });
});

describe('matchesSubscription', () => {
  const carro = { marca: 'BMW', modelo: 'Serie 3', local: 'Braga', preco: 20000 };

  it('dispatches by subscription tipo', () => {
    expect(
      matchesSubscription(carro, 'cars', { tipo: 'palavra_chave', keyword: 'bmw' }),
    ).toBe(true);
    expect(
      matchesSubscription(carro, 'cars', { tipo: 'criterio', criteria: { categoria: 'carros', concelho: 'Braga' } }),
    ).toBe(true);
    expect(
      matchesSubscription(carro, 'cars', { tipo: 'filtro_salvo', filters: { marca: 'BMW', precoMax: 25000 } }),
    ).toBe(true);
  });

  it('returns false for unknown tipos or malformed subscriptions', () => {
    expect(matchesSubscription(carro, 'cars', { tipo: 'outro' })).toBe(false);
    expect(matchesSubscription(carro, 'cars', {})).toBe(false);
    expect(matchesSubscription(carro, 'cars', { tipo: 'filtro_salvo' })).toBe(false);
  });
});
