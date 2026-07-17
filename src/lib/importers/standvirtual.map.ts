/**
 * Field mapping from a NormalizedAdvert (Standvirtual) to the RecarGarage car
 * form (plan 24 §04). Pure and tolerant by design: an unknown source value
 * never blocks the import — the target field stays empty and is reported in
 * `unmappedFields` so the user is told what needs review.
 */

import marcasModelos from '@/data/marcas-modelos.json';
// listingOptions/geo (not constants.ts) so the server routes can import this
// module without dragging icon components into the route bundle.
import { EQUIPAMENTOS_CARRO_PT, EQUIPAMENTOS_CARRO_BR, TIPOS_CARROCERIA } from '@/lib/listingOptions';
import { getAllConcelhos, getCoordenadas, getDistritoForConcelho, getDistritos } from '@/lib/geo';
import type { NormalizedAdvert } from '@/lib/importers/standvirtual.nextdata';
import type { CarroFormData } from '@/types/carro';

export interface MappedAdvert {
  dados: Partial<CarroFormData>;
  /** CarroFormData field names that need manual review. */
  unmappedFields: string[];
}

/** Lowercase, strip diacritics and non-alphanumerics — slug/label agnostic. */
function normalizeKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

const FUEL_BY_KEY: Record<string, CarroFormData['combustivel']> = {
  gaz: 'Gasolina',
  petrol: 'Gasolina',
  gasolina: 'Gasolina',
  diesel: 'Diesel',
  gasoleo: 'Diesel',
  electric: 'Elétrico',
  eletrico: 'Elétrico',
  electrico: 'Elétrico',
  hybrid: 'Híbrido',
  hibrido: 'Híbrido',
  pluginhybrid: 'Híbrido',
  hibridoplugin: 'Híbrido',
  hibridogasolina: 'Híbrido',
  hibridodiesel: 'Híbrido',
  etanol: 'Etanol',
  flex: 'Flex',
};

const GEARBOX_BY_KEY: Record<string, CarroFormData['cambio']> = {
  manual: 'Manual',
  automatic: 'Automático',
  automatica: 'Automático',
  automatico: 'Automático',
  cvt: 'CVT',
};

const BODY_BY_KEY: Record<string, string> = {
  suv: 'SUV',
  suvtt: 'SUV',
  offroad: 'SUV',
  sedan: 'Sedan',
  combi: 'Carrinha',
  estatecar: 'Carrinha',
  stationwagon: 'Carrinha',
  carrinha: 'Carrinha',
  citycar: 'Citadino',
  smallcar: 'Citadino',
  citadino: 'Citadino',
  compact: 'Utilitário',
  utilitario: 'Utilitário',
  minivan: 'Monovolume',
  monovolume: 'Monovolume',
  coupe: 'Coupé',
  cabrio: 'Cabrio',
  cabriolet: 'Cabrio',
  pickup: 'Pick-up',
};

const TRACTION_BY_KEY: Record<string, CarroFormData['traction']> = {
  frontwheeldrive: 'Dianteira',
  traccaodianteira: 'Dianteira',
  tracaodianteira: 'Dianteira',
  rearwheeldrive: 'Traseira',
  traccaotraseira: 'Traseira',
  tracaotraseira: 'Traseira',
  fourwheeldrive: 'Integral (4x4)',
  allwheeldrive: 'Integral (4x4)',
  '4x4': 'Integral (4x4)',
};

const CONDITION_BY_KEY: Record<string, string> = {
  used: 'Usado',
  usado: 'Usado',
  new: 'Novo',
  novo: 'Novo',
};

const UPHOLSTERY_BY_KEY: Record<string, string> = {
  cloth: 'Tecido',
  fabric: 'Tecido',
  tecido: 'Tecido',
  leather: 'Pele',
  pele: 'Pele',
  couro: 'Pele',
  ecoleather: 'Pele sintética',
  leatherette: 'Pele sintética',
  syntheticleather: 'Pele sintética',
  pelesintetica: 'Pele sintética',
  alcantara: 'Alcântara',
  other: 'Outro',
  outro: 'Outro',
};

/** Equipment option keys → entries of the EQUIPAMENTOS_CARRO checklist. */
const FEATURE_BY_EQUIPMENT_KEY: Record<string, (typeof EQUIPAMENTOS_CARRO_PT)[number] | (typeof EQUIPAMENTOS_CARRO_BR)[number]> = {
  air_conditioning: 'Ar condicionado',
  air_conditioning_type: 'Ar condicionado',
  manual_air_conditioning: 'Ar condicionado',
  automatic_heating_control: 'Climatização automática',
  power_steering: 'Direção assistida',
  power_windows_front: 'Vidros elétricos',
  power_windows_rear: 'Vidros elétricos',
  central_lock: 'Fecho centralizado',
  remote_central_lock: 'Fecho centralizado',
  park_distance_control_front: 'Sensores de estacionamento',
  park_distance_control_rear: 'Sensores de estacionamento',
  parking_sensors: 'Sensores de estacionamento',
  rear_camera: 'Câmara de marcha-atrás',
  camera_360: 'Câmara de marcha-atrás',
  navigation_system: 'GPS / Navegação',
  bluetooth_interface: 'Bluetooth',
  cruise_control: 'Cruise control',
  adaptive_cruise_control: 'Cruise control',
  leather_seats: 'Bancos em pele',
  heated_seats_front: 'Bancos aquecidos',
  heated_seats_rear: 'Bancos aquecidos',
  sunroof: 'Teto de abrir',
  electric_sunroof: 'Teto de abrir',
  panoramic_roof: 'Teto de abrir',
  alloy_wheels: 'Jantes de liga leve',
  aluminium_rims: 'Jantes de liga leve',
  xenon_lights: 'Faróis LED/Xénon',
  led_lights: 'Faróis LED/Xénon',
  headlights_led: 'Faróis LED/Xénon',
  child_seat_fixation: 'Isofix',
  isofix: 'Isofix',
  android_auto: 'Apple CarPlay / Android Auto',
  apple_carplay: 'Apple CarPlay / Android Auto',
  start_stop_system: 'Start/Stop',
  start_stop: 'Start/Stop',
};

interface MarcaEntry {
  marca: string;
  modelos: string[];
}

const CATALOG = marcasModelos as MarcaEntry[];
const CONCELHOS = getAllConcelhos();

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&');
}

/** Standvirtual descriptions are HTML — the form (and renderDescricao) expect plain text. */
export function htmlToPlainText(html: string): string {
  const text = html
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<\/\s*(p|div|li|h[1-6])\s*>/gi, '\n\n')
    .replace(/<[^>]+>/g, '');
  return decodeEntities(text)
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function parseIntStrict(value: string | undefined): number | null {
  if (!value) return null;
  const digits = value.replace(/[^\d]/g, '');
  if (!digits) return null;
  const parsed = Number.parseInt(digits, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/** "6,1" / "6.1" / "6.1 l/100km" → "6.1" (dot-normalized), or undefined. */
function parseDecimalString(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const match = /\d+(?:[.,]\d+)?/.exec(value);
  if (!match) return undefined;
  return match[0].replace(',', '.');
}

function matchCatalogMarca(label: string): MarcaEntry | undefined {
  const key = normalizeKey(label);
  return CATALOG.find((entry) => normalizeKey(entry.marca) === key);
}

function matchCatalogModelo(entry: MarcaEntry, label: string): string | undefined {
  const key = normalizeKey(label);
  return entry.modelos.find((modelo) => normalizeKey(modelo) === key);
}

function matchConcelho(...candidates: Array<string | undefined>): string | undefined {
  for (const candidate of candidates) {
    if (!candidate) continue;
    const key = normalizeKey(candidate);
    const match = CONCELHOS.find((concelho) => normalizeKey(concelho) === key);
    if (match) return match;
  }
  return undefined;
}

export function mapAdvertToCarroFormData(advert: NormalizedAdvert): MappedAdvert {
  const dados: Partial<CarroFormData> = {};
  const unmappedFields: string[] = [];
  const { params } = advert;

  const flag = (field: keyof CarroFormData) => {
    if (!unmappedFields.includes(field)) unmappedFields.push(field);
  };

  // A param maps through its value slug or its PT display label; whichever
  // hits the table first wins. Missing param and unknown value both flag.
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

  // Marca/modelo: match against the catalog; keep the raw label (still useful
  // in the draft) but flag when it is not a catalog entry.
  const makeLabel = params.make?.label;
  const modelLabel = params.model?.label;
  const catalogMarca = makeLabel ? matchCatalogMarca(makeLabel) : undefined;
  if (catalogMarca) {
    dados.marca = catalogMarca.marca;
  } else {
    if (makeLabel) dados.marca = makeLabel;
    flag('marca');
  }
  const catalogModelo = catalogMarca && modelLabel ? matchCatalogModelo(catalogMarca, modelLabel) : undefined;
  if (catalogModelo) {
    dados.modelo = catalogModelo;
  } else {
    if (modelLabel) dados.modelo = modelLabel;
    flag('modelo');
  }

  const year = parseIntStrict(params.first_registration_year?.value);
  if (year) {
    dados.anoFabricacao = String(year);
    // Standvirtual has no separate model year — first registration is the
    // best default; the user reviews it in the form.
    dados.anoModelo = String(year);
  } else {
    flag('anoFabricacao');
  }

  const km = parseIntStrict(params.mileage?.value);
  if (km) dados.km = String(km);
  else flag('km');

  if (advert.priceValue && advert.priceValue > 0 && (!advert.currency || advert.currency === 'EUR')) {
    dados.preco = String(advert.priceValue);
  } else {
    flag('preco');
  }

  const combustivel = mapParam('fuel_type', FUEL_BY_KEY, 'combustivel');
  if (combustivel) dados.combustivel = combustivel;

  const cambio = mapParam('gearbox', GEARBOX_BY_KEY, 'cambio');
  if (cambio) dados.cambio = cambio;

  const bodyType = mapParam('body_type', BODY_BY_KEY, 'bodyType');
  if (bodyType && (TIPOS_CARROCERIA as readonly string[]).includes(bodyType)) {
    dados.bodyType = bodyType;
  }

  // Optional fields: only flag when present but unusable.
  const cor = params.color?.label;
  if (cor) dados.cor = cor;

  const traction = params.transmission
    ? (TRACTION_BY_KEY[normalizeKey(params.transmission.value)] ??
      TRACTION_BY_KEY[normalizeKey(params.transmission.label)])
    : undefined;
  if (traction) dados.traction = traction;
  else if (params.transmission) flag('traction');

  const condition = params.new_used
    ? (CONDITION_BY_KEY[normalizeKey(params.new_used.value)] ?? CONDITION_BY_KEY[normalizeKey(params.new_used.label)])
    : undefined;
  if (condition) dados.condition = condition;
  else if (params.new_used) flag('condition');

  const portas = parseIntStrict(params.door_count?.value);
  if (portas) dados.portas = String(portas);

  const seats = parseIntStrict(params.nr_seats?.value);
  if (seats) dados.seats = String(seats);

  const power = parseIntStrict(params.engine_power?.value);
  if (power) dados.power = String(power);

  const displacement = parseIntStrict(params.engine_capacity?.value);
  if (displacement) dados.displacement = String(displacement);

  const concelho = matchConcelho(advert.location.concelhoSlug, advert.location.city);
  if (concelho) {
    dados.localizacao = concelho;
    dados.localizacaoDistrito = getDistritoForConcelho(concelho, 'PT') ?? '';
  } else {
    flag('localizacao');
  }
  // Standvirtual only lists Portuguese ads, so every geo lookup here is scoped to PT.
  if (!dados.localizacaoDistrito && advert.location.region && getDistritos('PT').includes(advert.location.region)) {
    dados.localizacaoDistrito = advert.location.region;
  }

  if (advert.descriptionHtml) {
    const descricao = htmlToPlainText(advert.descriptionHtml);
    if (descricao) dados.descricao = descricao;
  }
  if (!dados.descricao) flag('descricao');

  const features = new Set<string>();
  for (const key of advert.equipmentKeys) {
    const feature = FEATURE_BY_EQUIPMENT_KEY[key];
    if (feature) features.add(feature);
  }
  if (features.size > 0) dados.features = Array.from(features);

  // ---- Standvirtual-parity fields (plan 25) — all optional: absence is
  // silent, only a present-but-unrecognized value flags for review. ----

  /** First param present among the aliases (SV/Otomoto key names vary). */
  const firstParam = (...keys: string[]) => {
    for (const key of keys) {
      if (params[key]) return params[key];
    }
    return undefined;
  };
  /** Positive integer (rejects 0) from a param's value. */
  const intFrom = (...keys: string[]) => parseIntStrict(firstParam(...keys)?.value) ?? undefined;
  /** Non-negative integer (0 is meaningful, e.g. previous owners). */
  const countFrom = (...keys: string[]) => {
    const value = firstParam(...keys)?.value;
    if (!value) return undefined;
    const digits = value.replace(/[^\d]/g, '');
    return digits ? String(Number.parseInt(digits, 10)) : undefined;
  };
  /** "1"/"Sim" → true, "0"/"Não" → false, anything else → undefined. */
  const flagFrom = (...keys: string[]): boolean | undefined => {
    const param = firstParam(...keys);
    if (!param) return undefined;
    const key = normalizeKey(param.value) || normalizeKey(param.label);
    if (key === '1' || key === 'sim' || key === 'yes' || key === 'true') return true;
    if (key === '0' || key === 'nao' || key === 'no' || key === 'false') return false;
    return undefined;
  };

  const version = params.version_label?.value || params.version?.label;
  if (version) dados.version = version;

  const month = intFrom('first_registration_month');
  if (month && month >= 1 && month <= 12) dados.firstRegistrationMonth = String(month);

  const imported = flagFrom('is_imported_car');
  if (imported !== undefined) dados.origin = imported ? 'Importado' : 'Nacional';

  const upholsteryParam = firstParam('upholstery');
  if (upholsteryParam) {
    const upholstery =
      UPHOLSTERY_BY_KEY[normalizeKey(upholsteryParam.value)] ??
      UPHOLSTERY_BY_KEY[normalizeKey(upholsteryParam.label)];
    if (upholstery) dados.upholstery = upholstery;
    else flag('upholstery');
  }

  const previousOwners = countFrom('nr_of_owners', 'previous_owners', 'nr_owners');
  if (previousOwners !== undefined) dados.previousOwners = previousOwners;

  const gears = intFrom('nr_gears', 'gears', 'gearbox_gears');
  if (gears) dados.gears = String(gears);

  const co2 = countFrom('co2_emissions');
  if (co2 !== undefined) dados.co2Emissions = co2;

  const range = intFrom('max_fuel_range', 'range', 'battery_range');
  if (range) dados.maxFuelRange = String(range);

  const urban = parseDecimalString(firstParam('urban_consumption', 'consumption_urban')?.value);
  if (urban) dados.consumptionUrban = urban;
  const extraUrban = parseDecimalString(
    firstParam('extra_urban_consumption', 'consumption_extra_urban')?.value,
  );
  if (extraUrban) dados.consumptionExtraUrban = extraUrban;
  const combined = parseDecimalString(
    firstParam('mixed_consumption', 'combined_consumption', 'consumption_combined', 'average_consumption')?.value,
  );
  if (combined) dados.consumptionCombined = combined;

  const airbags = countFrom('nr_of_airbags', 'nr_airbags', 'airbags');
  if (airbags !== undefined) dados.numberOfAirbags = airbags;

  // Despite the name, this param carries the remaining months ("18 Meses").
  const warranty = countFrom('vendors_warranty_valid_until_date', 'vendors_warranty');
  if (warranty !== undefined && warranty !== '0') dados.warrantyMonths = warranty;

  if (flagFrom('accept_funding') === true) dados.acceptsFinancing = true;
  if (flagFrom('accept_returns') === true) dados.acceptsExchange = true;
  if (flagFrom('vat_discount', 'vat_deductible', 'vat') === true) dados.vatDeductible = true;

  return { dados, unmappedFields };
}

/**
 * Converts mapped form data into the Firestore car payload written by the
 * batch import route — the same string→number/undefined conversions the
 * Anunciar wizard performs on publish. Fields that did not map are omitted
 * (never written as empty strings/NaN).
 */
export function buildCarroPayload(dados: Partial<CarroFormData>): Record<string, unknown> {
  const num = (value: string | undefined): number | undefined => {
    if (!value) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  };
  // Zero is meaningful here (owners, CO₂…) — mirrors parseNonNegativeInt.
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
    coordenadas: dados.localizacao ? getCoordenadas(dados.localizacao, 'PT') : undefined,
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
