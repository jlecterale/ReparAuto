import type { BodyType } from '@/types/carro';

/**
 * Pure listing data/limits shared by client screens AND server code (API
 * routes). Kept icon-free on purpose: constants.ts imports Phosphor icons,
 * which cannot be evaluated inside route handlers — server modules import
 * from here, constants.ts re-exports for the existing client call sites.
 */

export const MAX_FOTOS_CARRO = 20;
export const MAX_FOTO_SIZE_MB = 10;
export const MAX_FOTO_SIZE_BYTES = MAX_FOTO_SIZE_MB * 1024 * 1024;

// Body type / category (carroçaria). A single Portuguese enum serves both the PT
// and BR markets — e.g. "Carrinha"/"Perua" and "Pick-up"/"Picape" are the same
// category. Used in the listing form and as a default filter. The element type
// annotation keeps the list checked against the union in types/carro.ts.
export const TIPOS_CARROCERIA: readonly BodyType[] = [
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

import type { Country } from '@/lib/country';

// Equipment / extras checklist (multi-select). Covers the most searched options
// across PT + BR marketplaces.
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
] as const;

export const EQUIPAMENTOS_CARRO_BR = [
  'Ar condicionado',
  'Climatização automática',
  'Direção hidráulica/elétrica',
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
] as const;

export const EQUIPAMENTOS_CARRO = EQUIPAMENTOS_CARRO_BR;

export function getEquipamentosCarro(country: Country): readonly string[] {
  return country === 'PT' ? EQUIPAMENTOS_CARRO_PT : EQUIPAMENTOS_CARRO_BR;
}

// Display labels for stored enum values. The stored values are canonical
// (pt-PT era, shared across markets and with the mobile app — renaming them is
// a data-schema change); only the label shown to the user varies by market.
// Kept in sync with the mobile `src/lib/constants.ts`.
const BODY_TYPE_LABELS_BR: Partial<Record<BodyType, string>> = {
  Citadino: 'Hatch',
  Sedan: 'Sedã',
  Carrinha: 'Perua / SW',
  Monovolume: 'Minivan',
  Coupé: 'Cupê',
  Cabrio: 'Conversível',
  'Pick-up': 'Picape',
};

export function bodyTypeLabel(value: string, country: Country): string {
  return (country === 'BR' && BODY_TYPE_LABELS_BR[value as BodyType]) || value;
}

// The BR value list above keeps the PT-era stored values for filter parity;
// these are the pt-BR names shown for them.
const EQUIPMENT_LABELS_BR: Record<string, string> = {
  'Direção assistida': 'Direção hidráulica/elétrica',
  'Fecho centralizado': 'Trava elétrica',
  'Câmara de marcha-atrás': 'Câmera de ré',
  'Bancos em pele': 'Bancos de couro',
  'Teto de abrir': 'Teto solar',
  'Jantes de liga leve': 'Rodas de liga leve',
  'Faróis LED/Xénon': 'Faróis LED/Xenon',
};

export function equipmentLabel(value: string, country: Country): string {
  return (country === 'BR' && EQUIPMENT_LABELS_BR[value]) || value;
}

const PART_CATEGORY_LABELS_BR: Record<string, string> = {
  'Carroçaria e Chaparia': 'Carroceria e Lataria',
  'Iluminação e Óticas': 'Iluminação e Faróis',
  'Suspensão e Travões': 'Suspensão e Freios',
  'Eletrónica e Sensores': 'Eletrônica e Sensores',
};

export function partCategoryLabel(value: string, country: Country): string {
  return (country === 'BR' && PART_CATEGORY_LABELS_BR[value]) || value;
}
