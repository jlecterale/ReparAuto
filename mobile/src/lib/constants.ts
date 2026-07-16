import type { Country } from '@/lib/country';
import type { BodyType, Cambio, Combustivel, Condition, EstadoVeiculo, Traction, Upholstery, VehicleOrigin } from '@/types';

export const COMBUSTIVEIS: Combustivel[] = [
  'Gasolina',
  'Diesel',
  'Elétrico',
  'Híbrido',
  'Flex',
  'Etanol',
];

export const CAMBIOS: Cambio[] = ['Manual', 'Automático', 'CVT'];

export const ESTADOS_VEICULO: { value: EstadoVeiculo; label: string }[] = [
  { value: 'pronto', label: 'Pronto a andar' },
  { value: 'manutencao', label: 'Para reparar' },
];

// Body type / category (carroçaria) — mirrors the web `TIPOS_CARROCERIA`. A
// single Portuguese enum serves both the PT and BR markets.
export const TIPOS_CARROCERIA: BodyType[] = [
  'Citadino',
  'Utilitário',
  'Sedan',
  'Carrinha',
  'SUV',
  'Monovolume',
  'Coupé',
  'Cabrio',
  'Pick-up',
];

// Vehicle condition — "Para peças" bridges the car and parts marketplaces.
export const CONDICOES_VEICULO: Condition[] = ['Novo', 'Usado', 'Para peças'];

// Drivetrain / traction.
export const TIPOS_TRACAO: Traction[] = ['Dianteira', 'Traseira', 'Integral (4x4)'];

// Vehicle origin — national vs. imported (mirrors web `ORIGENS_VEICULO`).
export const ORIGENS_VEICULO: VehicleOrigin[] = ['Nacional', 'Importado'];

// Upholstery / interior material (mirrors web `TIPOS_ESTOFO`).
export const TIPOS_ESTOFO_PT: Upholstery[] = ['Tecido', 'Pele', 'Pele sintética', 'Alcântara', 'Outro'];
export const TIPOS_ESTOFO_BR: Upholstery[] = ['Tecido', 'Couro', 'Couro sintético', 'Alcântara', 'Outro'];
export const TIPOS_ESTOFO = TIPOS_ESTOFO_BR;

export function getTiposEstofo(country: Country): Upholstery[] {
  return country === 'PT' ? TIPOS_ESTOFO_PT : TIPOS_ESTOFO_BR;
}

// Month labels for the first-registration selector — index + 1 is the stored value.
export const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

// Equipment / extras checklist (multi-select) — mirrors web `EQUIPAMENTOS_CARRO`.
export const EQUIPAMENTOS_CARRO_PT = [
  'Ar condicionado',
  'Climatização automática',
  'Direção assistida',
  'Vidros elétricos',
  'Fecho centralizado',
  'Sensores de estacionamento',
  'Câmara de marcha-atrás',
  'GPS / Navegação',
  'Bluetooth',
  'Cruise control',
  'Bancos em pele',
  'Bancos aquecidos',
  'Teto de abrir',
  'Jantes de liga leve',
  'Faróis LED/Xénon',
  'Isofix',
  'Apple CarPlay / Android Auto',
  'Start/Stop',
];

export const EQUIPAMENTOS_CARRO_BR = [
  'Ar condicionado',
  'Climatização automática',
  'Direção assistida',
  'Vidros elétricos',
  'Fecho centralizado',
  'Sensores de estacionamento',
  'Câmara de marcha-atrás',
  'GPS / Navegação',
  'Bluetooth',
  'Cruise control',
  'Bancos de couro',
  'Bancos aquecidos',
  'Teto de abrir',
  'Jantes de liga leve',
  'Faróis LED/Xénon',
  'Isofix',
  'Apple CarPlay / Android Auto',
  'Start/Stop',
];

export const EQUIPAMENTOS_CARRO = EQUIPAMENTOS_CARRO_BR;

export function getEquipamentosCarro(country: Country): string[] {
  return country === 'PT' ? EQUIPAMENTOS_CARRO_PT : EQUIPAMENTOS_CARRO_BR;
}

/** Hard limits mirrored from the web app. */
export const MAX_FOTOS_CARRO = 20;

/**
 * Every listing photo is cropped to this aspect ratio (width / height) so cards
 * and galleries render uniformly — 4:3 is the automotive-marketplace standard.
 * Mirrors the web `LISTING_PHOTO_ASPECT`.
 */
export const LISTING_PHOTO_ASPECT = 4 / 3;

/**
 * Numeric bounds for car-listing inputs — mirrored from the web `carSpec.ts`.
 * Feed both the `<Input maxLength>` first line of defence and `validar()` so a
 * listing can't carry absurd specs (year 99999, 500 doors, unbounded km/price).
 */
export const CAR_YEAR_MIN = 1900;
/** Upper year bound: the next model year (dealers list the coming year early). */
export const carYearMax = () => new Date().getFullYear() + 1;
export const CAR_KM_MAX = 999_999;
export const CAR_DOORS_MIN = 2;
export const CAR_DOORS_MAX = 7;
export const CAR_SEATS_MIN = 1;
// Passenger cars cap at 9; only van/minibus-style body types go higher.
export const CAR_SEATS_MAX = 9;
export const CAR_SEATS_MAX_LARGE = 99;
/** Body types that ship in van/minibus configurations with more than 9 seats. */
export const LARGE_SEAT_BODY_TYPES = ['Carrinha', 'Monovolume'] as const;

/** Max allowed seats for a given body type (99 for vans/minibuses, else 9). */
export function maxSeatsForBodyType(bodyType?: string): number {
  return bodyType && (LARGE_SEAT_BODY_TYPES as readonly string[]).includes(bodyType)
    ? CAR_SEATS_MAX_LARGE
    : CAR_SEATS_MAX;
}
export const CAR_POWER_MAX = 2000; // cv
export const CAR_DISPLACEMENT_MAX = 10_000; // cc
export const CAR_PRICE_MAX = 10_000_000; // market currency (€ / R$)

/**
 * Quick price-filter bands for the home screen chips ("Até …"), in the
 * market's currency. Listings are priced in their own market's currency, so
 * the EUR bands are meaningless in BRL — Brazil gets bands that map to the
 * same segments (fixer-uppers / cheap usable cars).
 */
export const QUICK_PRICE_BANDS: Record<Country, { low: number; mid: number }> = {
  PT: { low: 1_000, mid: 5_000 },
  BR: { low: 10_000, mid: 30_000 },
};

// Bounds for the Standvirtual-parity optional specs — mirror the web `carSpec.ts`.
export const CAR_GEARS_MAX = 12;
export const CAR_PREVIOUS_OWNERS_MAX = 50;
export const CAR_CO2_MAX = 999; // g/km
export const CAR_RANGE_MAX = 2000; // km
export const CAR_AIRBAGS_MAX = 20;
export const CAR_WARRANTY_MONTHS_MAX = 120; // 10 years
export const CAR_CONSUMPTION_MAX = 50; // l/100 km (decimals allowed)
export const CAR_VERSION_MAX = 60; // characters (trim / variant text)

/** Parses a PT-style decimal string ("5,6" or "5.6") to a number ≥ 0, or null. */
export function parseDecimalPt(raw: string): number | null {
  if (!raw.trim()) return null;
  const n = Number(raw.trim().replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Firestore collection that is the source of truth for brands/models. */
export const MARCAS_MODELOS_COLLECTION = 'marcas_modelos';

// Regions (PT distritos / BR estados) are country-aware — use
// `getDistritos(country)` from `@/lib/geo` instead of a static list.

/** Part categories / conditions (match the web constants for filter parity). */
export const CATEGORIAS_PECAS = [
  'Motor e Transmissão',
  'Carroçaria e Chaparia',
  'Iluminação e Óticas',
  'Interior e Bancos',
  'Suspensão e Travões',
  'Eletrónica e Sensores',
  'Carro Completo p/ Desmonte',
  'Outros',
];

export const ESTADOS_PECA = [
  'Usado (Segunda Mão)',
  'Novo (Em caixa)',
  'Reconstruído / Recondicionado',
  'Indiferente (Procura)',
];
