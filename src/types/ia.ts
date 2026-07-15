import type { EstadoVeiculo } from './carro';

/**
 * Shared types for the AI listing features (plan 4.1).
 *
 * Every AI call goes through a Cloud Function proxy (functions/src) — the
 * client never talks to the model. These types describe the request each
 * callable accepts and the ALREADY-VALIDATED response it returns: the server
 * sanitizes inputs, forces structured JSON output from the model and runs a
 * clamp/whitelist repair pass before anything reaches the client.
 *
 * Field names that mirror the Firestore car schema stay in Portuguese
 * (marca, modelo, km, …); new AI-only fields are English per convention.
 */

/** Vehicle facts sent to the description / price callables. */
export interface AIVehicleFacts {
  marca: string;
  modelo: string;
  anoFabricacao: number;
  anoModelo?: number;
  km?: number;
  combustivel?: string;
  cambio?: string;
  cor?: string;
  portas?: number;
  bodyType?: string;
  condition?: string;
  power?: number;
  displacement?: number;
  traction?: string;
  features?: string[];
  local?: string;
  estadoVeiculo?: EstadoVeiculo;
  tiposManutencao?: string[];
  rodando?: boolean;
  inspecao?: boolean;
}

export type AIDescriptionRequest = AIVehicleFacts;

export interface AIDescriptionResponse {
  /** Plain-text PT description (server-side sanitized, length-capped). */
  description: string;
  /** Weekly generations left for this user (server-authoritative). */
  remaining: number;
}

export interface AIPriceSuggestionRequest extends AIVehicleFacts {
  /** Price the seller currently intends to ask, if any. */
  preco?: number;
}

export interface AIPriceSuggestion {
  priceMin: number;
  priceRecommended: number;
  priceMax: number;
  /** Short PT explanation of the reasoning (plain text). */
  reasoning: string;
  /** How many comparable approved listings backed the market median (0 = none). */
  marketSampleSize: number;
}

export interface AIPriceSuggestionResponse extends AIPriceSuggestion {
  remaining: number;
}

export type DamageSeverity = 'minor' | 'moderate' | 'severe';

/** One damaged area found in a photo. Coordinates are fractions (0–1) of the image. */
export interface DamageArea {
  /** Short PT label, e.g. "Risco na porta". */
  label: string;
  severity: DamageSeverity;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DamageDetectionResult {
  /** Hash of the analyzed photo URL — cache key inside the car document. */
  photoHash: string;
  damages: DamageArea[];
  /** Short PT summary of the overall visible condition. */
  summary: string;
  /** Millis since epoch (server time) when the analysis ran. */
  analyzedAt: number;
}

export interface DamageDetectionRequest {
  carId: string;
  /** Index into the car document's `fotos` array — never an arbitrary URL. */
  photoIndex: number;
}

export interface DamageDetectionResponse {
  result: DamageDetectionResult;
  /** True when served from the per-photo cache (did not spend a generation). */
  cached: boolean;
  remaining: number;
}

/** Weekly free-tier cap, mirrored by the server (server is authoritative). */
export const FREE_WEEKLY_AI_LIMIT = 10;
