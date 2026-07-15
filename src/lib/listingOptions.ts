/**
 * Pure listing data/limits shared by client screens AND server code (API
 * routes). Kept icon-free on purpose: constants.ts imports Phosphor icons,
 * which cannot be evaluated inside route handlers — server modules import
 * from here, constants.ts re-exports for the existing client call sites.
 */

import type { BodyType, Condition, Traction } from '@/types/carro';

export const TIPOS_COMBUSTIVEL = [
  'Gasolina', 'Etanol', 'Flex', 'Diesel', 'Elétrico', 'Híbrido',
];

export const TIPOS_CAMBIO = ['Manual', 'Automático', 'CVT'];

export const MAX_FOTOS_CARRO = 20;
export const MAX_FOTO_SIZE_MB = 10;
export const MAX_FOTO_SIZE_BYTES = MAX_FOTO_SIZE_MB * 1024 * 1024;

// Body type / category (carroçaria). A single Portuguese enum serves both the PT
// and BR markets — e.g. "Carrinha"/"Perua" and "Pick-up"/"Picape" are the same
// category. Used in the listing form and as a default filter. The element type
// annotations keep these lists checked against the unions in types/carro.ts.
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

// Vehicle condition. "Para peças" bridges the car and parts marketplaces.
export const CONDICOES_VEICULO: readonly Condition[] = ['Novo', 'Usado', 'Para peças'];

// Drivetrain / traction.
export const TIPOS_TRACAO: readonly Traction[] = ['Dianteira', 'Traseira', 'Integral (4x4)'];

// Equipment / extras checklist (multi-select). Covers the most searched options
// across PT + BR marketplaces.
export const EQUIPAMENTOS_CARRO = [
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
