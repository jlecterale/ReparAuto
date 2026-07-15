/**
 * Builds the sanitized vehicle-facts payload that goes into prompts.
 * Everything is untrusted client input: strings pass through sanitizeUserText
 * (length cap + reserved-tag strip + injection-marker drop) and numbers are
 * clamped to plausible bounds before they can reach the model.
 */
import { HttpsError } from "firebase-functions/v2/https";
import { clampInt } from "./aiValidate";
import { sanitizeUserText } from "./sanitize";

const MAX_SHORT_FIELD = 60;
const MAX_LIST_ITEMS = 20;

export interface VehicleFacts {
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
  estadoVeiculo?: string;
  tiposManutencao?: string[];
  rodando?: boolean;
  inspecao?: boolean;
}

function cleanShort(value: unknown): string | undefined {
  const text = sanitizeUserText(value as string, MAX_SHORT_FIELD);
  return text || undefined;
}

function cleanList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const list = value
    .slice(0, MAX_LIST_ITEMS)
    .map((item) => sanitizeUserText(item as string, MAX_SHORT_FIELD))
    .filter((item) => item.length > 0);
  return list.length > 0 ? list : undefined;
}

function cleanPositiveInt(value: unknown, max: number): number | undefined {
  const num = clampInt(value, 0, max, 0);
  return num > 0 ? num : undefined;
}

/** Throws invalid-argument unless marca/modelo/anoFabricacao are usable. */
export function buildVehicleFacts(data: unknown): VehicleFacts {
  const raw = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
  const marca = cleanShort(raw.marca);
  const modelo = cleanShort(raw.modelo);
  const currentYear = new Date().getUTCFullYear();
  const anoFabricacao = clampInt(raw.anoFabricacao, 0, currentYear + 1, 0);
  if (!marca || !modelo || anoFabricacao < 1900) {
    throw new HttpsError(
      "invalid-argument",
      "marca, modelo and anoFabricacao are required.",
    );
  }
  return {
    marca,
    modelo,
    anoFabricacao,
    anoModelo: cleanPositiveInt(raw.anoModelo, currentYear + 1),
    km: cleanPositiveInt(raw.km, 2_000_000),
    combustivel: cleanShort(raw.combustivel),
    cambio: cleanShort(raw.cambio),
    cor: cleanShort(raw.cor),
    portas: cleanPositiveInt(raw.portas, 9),
    bodyType: cleanShort(raw.bodyType),
    condition: cleanShort(raw.condition),
    power: cleanPositiveInt(raw.power, 2000),
    displacement: cleanPositiveInt(raw.displacement, 10_000),
    traction: cleanShort(raw.traction),
    features: cleanList(raw.features),
    local: cleanShort(raw.local),
    estadoVeiculo: raw.estadoVeiculo === "manutencao" ? "manutencao" : "pronto",
    tiposManutencao: cleanList(raw.tiposManutencao),
    rodando: typeof raw.rodando === "boolean" ? raw.rodando : undefined,
    inspecao: typeof raw.inspecao === "boolean" ? raw.inspecao : undefined,
  };
}
