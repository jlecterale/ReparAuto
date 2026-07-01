import type { Cambio, Combustivel, EstadoVeiculo } from '@/types';

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

/** Hard limits mirrored from the web app. */
export const MAX_FOTOS_CARRO = 7;

/**
 * Every listing photo is cropped to this aspect ratio (width / height) so cards
 * and galleries render uniformly — 4:3 is the automotive-marketplace standard.
 * Mirrors the web `LISTING_PHOTO_ASPECT`.
 */
export const LISTING_PHOTO_ASPECT = 4 / 3;

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
