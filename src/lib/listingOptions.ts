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
