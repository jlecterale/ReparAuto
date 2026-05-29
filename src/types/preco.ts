import type { Timestamp } from 'firebase/firestore';

export type PriceIndicator = 'abaixo' | 'justo' | 'acima' | 'indisponivel';

export interface MarketStats {
  count: number;
  min: number;
  max: number;
  mean: number;
  median: number;
  p25: number;
  p75: number;
  stdDev: number;
}

export interface PriceEstimate {
  estimate: number;
  rangeMin: number;
  rangeMax: number;
  sampleSize: number;
  confidence: 'baixa' | 'media' | 'alta';
  stats: MarketStats | null;
}

export interface PriceIndicatorResult {
  indicator: PriceIndicator;
  deviation: number;
  stats: MarketStats | null;
  sampleSize: number;
}

export interface PriceSnapshot {
  id: string;
  marca: string;
  modelo: string;
  modeloNormalizado: string;
  anoMin?: number;
  anoMax?: number;
  median: number;
  mean: number;
  count: number;
  min: number;
  max: number;
  p25: number;
  p75: number;
  dataCriacao: Timestamp;
}

export type PriceSnapshotInput = Omit<PriceSnapshot, 'id' | 'dataCriacao'>;

export interface SavedSearchCriteria {
  marca?: string;
  modelo?: string;
  anoMin?: number;
  anoMax?: number;
  precoMin?: number;
  precoMax?: number;
  kmMax?: number;
  combustivel?: string;
  cambio?: string;
  distrito?: string;
}

export interface SavedSearch {
  id: string;
  uid: string;
  nome: string;
  criterios: SavedSearchCriteria;
  alertasAtivos: boolean;
  dataCriacao: Timestamp;
  ultimoAlerta?: Timestamp;
}

export type SavedSearchInput = Omit<SavedSearch, 'id' | 'dataCriacao' | 'ultimoAlerta'>;

export interface PriceEstimateInput {
  marca: string;
  modelo: string;
  ano: number;
  km?: number;
  combustivel?: string;
  cambio?: string;
}
