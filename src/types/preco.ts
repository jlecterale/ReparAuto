import type { Timestamp } from 'firebase/firestore';
import type { Country } from '@/lib/country';

export type PriceIndicator =
  | 'excelente'
  | 'bom'
  | 'justo'
  | 'acima'
  | 'sobrevalorizado'
  | 'indisponivel';

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

export interface PriceEstimateInput {
  marca: string;
  modelo: string;
  ano: number;
  km?: number;
  combustivel?: string;
  cambio?: string;
  /** Market the comparables must belong to — defaults to PT when omitted. */
  country?: Country;
}
