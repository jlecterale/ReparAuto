import type { Cambio, Combustivel, EstadoVeiculo } from './carro';

/**
 * Advanced-search filter set, shared between plan 3.2 (advanced search UI)
 * and plan 3.1 (saved-filter alerts). Every field is optional — an empty
 * object matches everything. Values mirror the Firestore listing fields
 * (`local` holds the concelho on car/part docs).
 */
export interface SearchFilters {
  texto?: string;
  marca?: string;
  modelo?: string;
  combustivel?: Combustivel;
  cambio?: Cambio;
  cor?: string;
  portas?: number;
  concelho?: string;
  distrito?: string;
  precoMin?: number;
  precoMax?: number;
  anoMin?: number;
  anoMax?: number;
  kmMin?: number;
  kmMax?: number;
  estadoVeiculo?: EstadoVeiculo;
  rodando?: boolean;
  inspecao?: boolean;
  minFotos?: number;
}
