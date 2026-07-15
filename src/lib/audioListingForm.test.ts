import {
  applyCarAudioFieldsToForm,
  applyPartAudioFieldsToForm,
  partCompatibilityFromAudio,
} from '@/lib/audioListingForm';
import type { CarroFormData } from '@/types/carro';

const emptyCarForm: CarroFormData = {
  marca: '',
  modelo: '',
  anoFabricacao: '',
  anoModelo: '',
  km: '',
  cor: '',
  combustivel: 'Gasolina',
  cambio: 'Manual',
  portas: '',
  bodyType: '',
  seats: '',
  condition: 'Usado',
  power: '',
  displacement: '',
  traction: '',
  features: [],
  version: '',
  firstRegistrationMonth: '',
  origin: '',
  previousOwners: '',
  gears: '',
  co2Emissions: '',
  maxFuelRange: '',
  consumptionUrban: '',
  consumptionExtraUrban: '',
  consumptionCombined: '',
  upholstery: '',
  numberOfAirbags: '',
  warrantyMonths: '',
  acceptsFinancing: false,
  vatDeductible: false,
  acceptsExchange: false,
  localizacao: '',
  localizacaoDistrito: '',
  bairro: '',
  preco: '',
  descricao: '',
  videoUrl: '',
  estadoVeiculo: 'pronto',
  rodando: 'sim',
  inspecao: 'sim',
  tiposManutencao: [],
  orcamentoTexto: '',
  incluirMecanicoNome: false,
  incluirMecanicoTelefone: false,
  mecanicoNome: '',
  mecanicoTelefone: '',
  vendedorWhatsApp: '',
  vendedorTelefone: '',
  vendedorEmail: '',
};

describe('applyCarAudioFieldsToForm', () => {
  it('fills empty fields from the extraction, numbers as strings', () => {
    const next = applyCarAudioFieldsToForm(emptyCarForm, {
      marca: 'Renault',
      modelo: 'Clio',
      anoFabricacao: 2012,
      km: 180000,
      preco: 4500,
      cor: 'Cinzento',
      portas: 5,
      combustivel: 'Diesel',
      cambio: 'Automático',
      estadoVeiculo: 'manutencao',
      descricao: 'Bom estado geral.',
    });
    expect(next.marca).toBe('Renault');
    expect(next.modelo).toBe('Clio');
    expect(next.anoFabricacao).toBe('2012');
    expect(next.km).toBe('180000');
    expect(next.preco).toBe('4500');
    expect(next.cor).toBe('Cinzento');
    expect(next.portas).toBe('5');
    expect(next.combustivel).toBe('Diesel');
    expect(next.cambio).toBe('Automático');
    expect(next.estadoVeiculo).toBe('manutencao');
    expect(next.descricao).toBe('Bom estado geral.');
  });

  it('mirrors anoFabricacao into an empty anoModelo', () => {
    const next = applyCarAudioFieldsToForm(emptyCarForm, { anoFabricacao: 2012 });
    expect(next.anoModelo).toBe('2012');
  });

  it('never overwrites values the user already typed', () => {
    const filled = { ...emptyCarForm, marca: 'BMW', km: '90000', descricao: 'Original.' };
    const next = applyCarAudioFieldsToForm(filled, {
      marca: 'Renault',
      km: 180000,
      descricao: 'Outra descrição.',
    });
    expect(next.marca).toBe('BMW');
    expect(next.km).toBe('90000');
    expect(next.descricao).toBe('Original.');
  });

  it('fills localizacao only when the concelho was resolved to a distrito', () => {
    const matched = applyCarAudioFieldsToForm(emptyCarForm, { local: 'Lisboa', distrito: 'Lisboa' });
    expect(matched.localizacao).toBe('Lisboa');
    expect(matched.localizacaoDistrito).toBe('Lisboa');

    const unmatched = applyCarAudioFieldsToForm(emptyCarForm, { local: 'Nárnia' });
    expect(unmatched.localizacao).toBe('');
    expect(unmatched.localizacaoDistrito).toBe('');
  });

  it('merges features without duplicating existing ones', () => {
    const filled = { ...emptyCarForm, features: ['Bluetooth'] };
    const next = applyCarAudioFieldsToForm(filled, { features: ['Bluetooth', 'Isofix'] });
    expect(next.features).toEqual(['Bluetooth', 'Isofix']);
  });
});

describe('applyPartAudioFieldsToForm', () => {
  const emptyPartForm = {
    tipo: 'venda',
    titulo: '',
    categoria: 'Motor e Transmissão',
    estado: 'Usado',
    marcaCarro: '',
    numeroOEM: '',
    preco: '',
    descricao: '',
    localizacao: '',
    localizacaoDistrito: '',
    bairro: '',
    vendedorTelefone: '',
    vendedorWhatsApp: '',
    vendedorEmail: '',
  };

  it('fills the part form, overwriting select defaults but not typed text', () => {
    const next = applyPartAudioFieldsToForm(
      { ...emptyPartForm, titulo: 'Título meu' },
      {
        tipo: 'procura',
        titulo: 'Alternador Clio II',
        categoria: 'Eletrónica e Sensores',
        estado: 'Novo (Em caixa)',
        preco: 60,
        descricao: 'Testado.',
        local: 'Porto',
        distrito: 'Porto',
      },
    );
    expect(next.tipo).toBe('procura');
    expect(next.titulo).toBe('Título meu');
    expect(next.categoria).toBe('Eletrónica e Sensores');
    expect(next.estado).toBe('Novo (Em caixa)');
    expect(next.preco).toBe('60');
    expect(next.descricao).toBe('Testado.');
    expect(next.localizacao).toBe('Porto');
    expect(next.localizacaoDistrito).toBe('Porto');
  });
});

describe('partCompatibilityFromAudio', () => {
  it('builds a compatibility entry from the extracted car brand/model', () => {
    expect(partCompatibilityFromAudio({ marcaCarro: 'Renault', modeloCarro: 'Clio' })).toEqual({
      marca: 'Renault',
      modelo: 'Clio',
    });
    expect(partCompatibilityFromAudio({ marcaCarro: 'Renault' })).toEqual({ marca: 'Renault' });
  });

  it('returns null without a brand', () => {
    expect(partCompatibilityFromAudio({ modeloCarro: 'Clio' })).toBeNull();
    expect(partCompatibilityFromAudio({})).toBeNull();
  });
});
