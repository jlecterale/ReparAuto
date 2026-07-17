import type { Timestamp } from 'firebase/firestore';

/** Engagement signal recorded per (seller, day) for the professional dashboard. */
export type MetricKind = 'view' | 'contact';

/**
 * Per-seller daily aggregate. One document per (ownerUid, date) keyed
 * `${ownerUid}_${YYYY-MM-DD}` (day in Europe/Lisbon). Lets the dashboard draw
 * 30/90-day charts with O(days) reads regardless of how many listings exist.
 */
export interface SellerDailyMetrics {
  id: string;
  ownerUid: string;
  date: string; // 'YYYY-MM-DD'
  views: number;
  contacts: number;
  updatedAt?: Timestamp;
}

/** One point of the time-series chart. */
export interface MetricPoint {
  date: string; // 'YYYY-MM-DD'
  views: number;
  contacts: number;
}

/** Aggregated headline numbers shown on the dashboard. */
export interface DashboardSummary {
  anunciosAtivos: number;
  anunciosPendentes: number;
  visualizacoesTotais: number;
  contactosTotais: number;
  favoritosTotais: number;
  // Period window (last N days) vs. the previous window, from daily buckets.
  viewsPeriodo: number;
  viewsPeriodoAnterior: number;
  contactsPeriodo: number;
  contactsPeriodoAnterior: number;
}

export type DashboardPeriod = 7 | 30 | 90;
