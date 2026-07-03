// Audio-ad assistant client (plan 24): sends a recorded/picked audio to the
// website's /api/listing-from-audio route, which has Gemini transcribe and
// extract the listing fields. The server sanitizes everything against the
// domain (enums, bounds, brand catalog) — the app only maps the result into
// its form state.

import { auth } from '@/lib/firebase';
import type {
  BodyType,
  Cambio,
  Combustivel,
  Condition,
  EstadoVeiculo,
  TipoPeca,
  Traction,
} from '@/types';

/** Base URL of the RecarGarage website that hosts the API route. */
export const WEB_API_BASE_URL =
  process.env.EXPO_PUBLIC_WEB_API_BASE_URL ?? 'https://www.recargarage.com';

/** Mirrors the server's 12 MB cap (base64 must stay under Gemini's 20 MB). */
export const AUDIO_MAX_BYTES = 12 * 1024 * 1024;
export const AUDIO_MAX_MB = 12;

/** Audio formats the server accepts (Gemini-supported after normalization). */
export const SUPPORTED_AUDIO_EXTENSIONS = [
  'mp3', 'wav', 'm4a', 'mp4', 'aac', 'ogg', 'oga', 'opus', 'flac', 'aiff', 'aif',
];

export interface CarAudioFields {
  marca?: string;
  modelo?: string;
  anoFabricacao?: number;
  km?: number;
  preco?: number;
  cor?: string;
  portas?: number;
  seats?: number;
  power?: number;
  displacement?: number;
  combustivel?: Combustivel;
  cambio?: Cambio;
  bodyType?: BodyType;
  condition?: Condition;
  traction?: Traction;
  estadoVeiculo?: EstadoVeiculo;
  features?: string[];
  local?: string;
  distrito?: string;
  descricao?: string;
}

export interface PartAudioFields {
  tipo?: TipoPeca;
  titulo?: string;
  categoria?: string;
  estado?: string;
  marcaCarro?: string;
  modeloCarro?: string;
  preco?: number;
  numeroOEM?: string;
  local?: string;
  distrito?: string;
  descricao?: string;
}

export type AudioListingKind = 'carro' | 'peca';

export interface AudioListingResponse<F> {
  fields: F;
  transcript?: string;
}

export interface AudioFileInput {
  uri: string;
  name: string;
  mimeType: string;
}

const GENERIC_ERROR = 'Não foi possível interpretar o áudio. Tente novamente.';

export async function requestListingFromAudio(
  file: AudioFileInput,
  kind: 'carro',
): Promise<AudioListingResponse<CarAudioFields>>;
export async function requestListingFromAudio(
  file: AudioFileInput,
  kind: 'peca',
): Promise<AudioListingResponse<PartAudioFields>>;
export async function requestListingFromAudio(
  file: AudioFileInput,
  kind: AudioListingKind,
): Promise<AudioListingResponse<CarAudioFields | PartAudioFields>> {
  const token = await auth.currentUser?.getIdToken().catch(() => null);
  if (!token) {
    throw new Error('Inicie sessão para usar o assistente de áudio.');
  }

  const body = new FormData();
  // React Native FormData takes a { uri, name, type } descriptor for files.
  body.append('audio', { uri: file.uri, name: file.name, type: file.mimeType } as unknown as Blob);
  body.append('kind', kind);

  let response: Response;
  try {
    response = await fetch(`${WEB_API_BASE_URL}/api/listing-from-audio`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body,
    });
  } catch {
    throw new Error('Sem ligação. Verifique a internet e tente novamente.');
  }

  const payload = (await response.json().catch(() => null)) as
    | { error?: string; fields?: CarAudioFields | PartAudioFields; transcript?: string }
    | null;

  if (!response.ok) {
    throw new Error(payload?.error || GENERIC_ERROR);
  }
  return { fields: payload?.fields ?? {}, transcript: payload?.transcript };
}

/**
 * Maps the server's part-condition vocabulary (the web form's labels) to the
 * mobile form's shorter options.
 */
export function partEstadoFromAudio(estado?: string): string | undefined {
  if (!estado) return undefined;
  if (estado.startsWith('Novo')) return 'Novo';
  if (estado.startsWith('Usado')) return 'Usado';
  if (estado.startsWith('Reconstruído')) return 'Recondicionado';
  return undefined;
}
