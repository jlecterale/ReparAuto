import { EQUIPAMENTOS_CARRO, TIPOS_CARROCERIA } from '@/lib/listingOptions';
import { getCoordenadas } from '@/lib/geo';
import type { NormalizedAdvert } from '@/lib/importers/standvirtual.nextdata';
import type { CarroFormData } from '@/types/carro';

export interface MappedAdvert {
  dados: Partial<CarroFormData>;
  /** CarroFormData field names that need manual review. */
  unmappedFields: string[];
}

function normalizeKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

const FUEL_BY_KEY: Record<string, CarroFormData['combustivel']> = {
  gasolina: 'Gasolina',
  etanol: 'Etanol',
  alcohol: 'Etanol',
  alcool: 'Etanol',
  flex: 'Flex',
  diesel: 'Diesel',
  eletrico: 'Elétrico',
  electric: 'Elétrico',
  hibrido: 'Híbrido',
  hybrid: 'Híbrido',
};

const GEARBOX_BY_KEY: Record<string, CarroFormData['cambio']> = {
  manual: 'Manual',
  automatico: 'Automático',
  automatica: 'Automático',
  automatic: 'Automático',
  cvt: 'CVT',
};

const BODY_BY_KEY: Record<string, string> = {
  suv: 'SUV',
  sedan: 'Sedan',
  hatch: 'Citadino',
  hatchback: 'Citadino',
  minivan: 'Monovolume',
  monovolume: 'Monovolume',
  coupe: 'Coupé',
  cabrio: 'Cabrio',
  cabriolet: 'Cabrio',
  conversivel: 'Cabrio',
  pickup: 'Pick-up',
  picape: 'Pick-up',
  perua: 'Carrinha',
  wagon: 'Carrinha',
};

const TRACTION_BY_KEY: Record<string, CarroFormData['traction']> = {
  dianteira: 'Dianteira',
  traseira: 'Traseira',
  integral: 'Integral (4x4)',
  '4x4': 'Integral (4x4)',
  '4wd': 'Integral (4x4)',
  awd: 'Integral (4x4)',
};

const CONDITION_BY_KEY: Record<string, string> = {
  usado: 'Usado',
  novo: 'Novo',
};

const UPHOLSTERY_BY_KEY: Record<string, string> = {
  tecido: 'Tecido',
  couro: 'Pele',
  pele: 'Pele',
  leather: 'Pele',
  pelesintetica: 'Pele sintética',
  alcantara: 'Alcântara',
  outro: 'Outro',
};

const FEATURE_BY_EQUIPMENT_KEY: Record<string, (typeof EQUIPAMENTOS_CARRO)[number]> = {
  arcondicionado: 'Ar condicionado',
  direcaohidraulica: 'Direção assistida',
  direcaoassistida: 'Direção assistida',
  direcaoeletrica: 'Direção assistida',
  vidroseletricos: 'Vidros elétricos',
  travaseletricas: 'Fecho centralizado',
  fechocentralizado: 'Fecho centralizado',
  sensoresdeestacionamento: 'Sensores de estacionamento',
  sensordeestacionamento: 'Sensores de estacionamento',
  camaraderes: 'Câmara de marcha-atrás',
  gps: 'GPS / Navegação',
  navegacao: 'GPS / Navegação',
  bluetooth: 'Bluetooth',
  pilotoautomatico: 'Cruise control',
  cruisecontrol: 'Cruise control',
  bancosdecouro: 'Bancos em pele',
  bancosempele: 'Bancos em pele',
  bancosaquecidos: 'Bancos aquecidos',
  tetosolar: 'Teto de abrir',
  tetopanoramico: 'Teto de abrir',
  jantesdeligaleve: 'Jantes de liga leve',
  rodasdeligaleve: 'Jantes de liga leve',
  faroisdeled: 'Faróis LED/Xénon',
  faroisdexenon: 'Faróis LED/Xénon',
  isofix: 'Isofix',
  androidauto: 'Apple CarPlay / Android Auto',
  applecarplay: 'Apple CarPlay / Android Auto',
  startstop: 'Start/Stop',
};

export function mapWebmotorsAdvertToCarroFormData(advert: NormalizedAdvert): MappedAdvert {
  const dados: Partial<CarroFormData> = {};
  const unmappedFields: string[] = [];
  const { params } = advert;

  const flag = (field: keyof CarroFormData) => {
    if (!unmappedFields.includes(field)) unmappedFields.push(field);
  };

  const mapParam = <T extends string>(
    paramKey: string,
    table: Record<string, T>,
    field: keyof CarroFormData,
  ): T | undefined => {
    const param = params[paramKey];
    const mapped = param
      ? (table[normalizeKey(param.value)] ?? table[normalizeKey(param.label)])
      : undefined;
    if (!mapped) flag(field);
    return mapped;
  };

  // Brand / Model
  const brand = params['marca']?.label;
  if (brand) {
    dados.marca = brand;
  } else {
    flag('marca');
  }

  const model = params['modelo']?.label;
  if (model) {
    dados.modelo = model;
  } else {
    flag('modelo');
  }

  const version = params['versao']?.label;
  if (version) dados.version = version;

  // Year (fabricação e modelo)
  const yearParam = params['ano']?.value;
  if (yearParam) {
    dados.anoFabricacao = yearParam;
    dados.anoModelo = yearParam; // Fallback same as fabrication year
  } else {
    flag('anoFabricacao');
  }

  // KM
  const kmParam = params['quilometragem']?.value;
  if (kmParam) {
    dados.km = kmParam;
  } else {
    flag('km');
  }

  // Price
  if (advert.priceValue && advert.priceValue > 0 && (!advert.currency || advert.currency === 'BRL')) {
    dados.preco = String(advert.priceValue);
  } else {
    flag('preco');
  }

  // Fuel
  const combustivel = mapParam('combustivel', FUEL_BY_KEY, 'combustivel');
  if (combustivel) dados.combustivel = combustivel;

  // Transmission
  const cambio = mapParam('cambio', GEARBOX_BY_KEY, 'cambio');
  if (cambio) dados.cambio = cambio;

  // Color
  const cor = params['cor']?.label;
  if (cor) dados.cor = cor;

  // Body Type
  const bodyType = mapParam('body_type', BODY_BY_KEY, 'bodyType');
  if (bodyType && (TIPOS_CARROCERIA as readonly string[]).includes(bodyType)) {
    dados.bodyType = bodyType;
  }

  // Description
  dados.descricao = advert.descriptionHtml
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .trim();

  // Features (Equipamentos)
  const features: string[] = [];
  advert.equipmentKeys.forEach((key) => {
    const feat = FEATURE_BY_EQUIPMENT_KEY[normalizeKey(key)];
    if (feat && !features.includes(feat)) {
      features.push(feat);
    }
  });
  dados.features = features;

  return { dados, unmappedFields };
}

export function buildWebmotorsCarroPayload(dados: Partial<CarroFormData>): Record<string, unknown> {
  const num = (value: string | undefined): number | undefined => {
    if (!value) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  };
  const num0 = (value: string | undefined): number | undefined => {
    if (!value) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
  };

  const payload: Record<string, unknown> = {
    marca: dados.marca,
    modelo: dados.modelo,
    anoFabricacao: num(dados.anoFabricacao),
    anoModelo: num(dados.anoModelo),
    preco: num(dados.preco),
    km: num(dados.km),
    combustivel: dados.combustivel,
    cambio: dados.cambio,
    cor: dados.cor,
    portas: num(dados.portas),
    bodyType: dados.bodyType || undefined,
    seats: num(dados.seats),
    condition: dados.condition || undefined,
    power: num(dados.power),
    displacement: num(dados.displacement),
    traction: dados.traction || undefined,
    features: dados.features?.length ? dados.features : undefined,
    version: dados.version?.trim() || undefined,
    firstRegistrationMonth: num(dados.firstRegistrationMonth),
    origin: dados.origin || undefined,
    previousOwners: num0(dados.previousOwners),
    gears: num(dados.gears),
    co2Emissions: num0(dados.co2Emissions),
    maxFuelRange: num0(dados.maxFuelRange),
    consumptionUrban: num0(dados.consumptionUrban),
    consumptionExtraUrban: num0(dados.consumptionExtraUrban),
    consumptionCombined: num0(dados.consumptionCombined),
    upholstery: dados.upholstery || undefined,
    numberOfAirbags: num0(dados.numberOfAirbags),
    warrantyMonths: num0(dados.warrantyMonths),
    acceptsFinancing: dados.acceptsFinancing || undefined,
    vatDeductible: dados.vatDeductible || undefined,
    acceptsExchange: dados.acceptsExchange || undefined,
    local: dados.localizacao,
    distrito: dados.localizacaoDistrito || undefined,
    bairro: dados.bairro || undefined,
    coordenadas: dados.localizacao ? getCoordenadas(dados.localizacao, 'BR') : undefined,
    descricao: dados.descricao ?? '',
    estadoVeiculo: 'pronto',
    tiposManutencao: [],
    rodando: true,
    inspecao: true,
  };

  for (const key of Object.keys(payload)) {
    if (payload[key] === undefined) delete payload[key];
  }
  return payload;
}
