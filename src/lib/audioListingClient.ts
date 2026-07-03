// Client-side caller of POST /api/listing-from-audio (plan 24).

import { auth } from '@/lib/firebase';
import type { AudioListingKind, CarAudioFields, PartAudioFields } from '@/lib/audioListing';

export interface AudioListingResponse<F> {
  fields: F;
  transcript?: string;
}

const GENERIC_ERROR = 'Não foi possível interpretar o áudio. Tente novamente.';

export async function requestListingFromAudio(
  audio: Blob,
  fileName: string,
  kind: 'carro',
): Promise<AudioListingResponse<CarAudioFields>>;
export async function requestListingFromAudio(
  audio: Blob,
  fileName: string,
  kind: 'peca',
): Promise<AudioListingResponse<PartAudioFields>>;
export async function requestListingFromAudio(
  audio: Blob,
  fileName: string,
  kind: AudioListingKind,
): Promise<AudioListingResponse<CarAudioFields | PartAudioFields>> {
  const token = await auth.currentUser?.getIdToken().catch(() => null);
  if (!token) {
    throw new Error('Inicie sessão para usar o assistente de áudio.');
  }

  const body = new FormData();
  body.append('audio', new File([audio], fileName, { type: audio.type }));
  body.append('kind', kind);

  let response: Response;
  try {
    response = await fetch('/api/listing-from-audio', {
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
