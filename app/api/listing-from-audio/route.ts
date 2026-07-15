// POST /api/listing-from-audio — audio-ad assistant backend (plan 24).
// Receives a short audio (recorded or picked by the user) plus the listing
// kind, has Gemini transcribe + extract the listing fields in one multimodal
// call, and returns sanitized, form-ready fields. Costs money per call, so it
// requires a signed-in user (Firebase ID token).

import { NextResponse, type NextRequest } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getAdminAuth } from '@/lib/firebase.admin';
import {
  AUDIO_MAX_BYTES,
  AUDIO_MAX_MB,
  buildAudioListingPrompt,
  CAR_AUDIO_RESPONSE_SCHEMA,
  geminiAudioMimeType,
  PART_AUDIO_RESPONSE_SCHEMA,
  sanitizeCarFields,
  sanitizePartFields,
  type AudioListingKind,
} from '@/lib/audioListing';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Floating alias: always resolves to the current stable Gemini Flash model, so
// the default tracks Google's latest without pinning a version here. Override
// with GEMINI_MODEL to pin an exact model when a specific one is needed.
const DEFAULT_GEMINI_MODEL = 'gemini-flash-latest';

const jsonError = (status: number, error: string) => NextResponse.json({ error }, { status });

async function verifyUser(request: NextRequest): Promise<'ok' | 'unauthorized' | 'unavailable'> {
  const header = request.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';
  if (!token) return 'unauthorized';
  const adminAuth = getAdminAuth();
  // Without Admin credentials (misconfigured server) we cannot verify anyone —
  // fail closed but with a distinct status so the client can explain it.
  if (!adminAuth) return 'unavailable';
  try {
    await adminAuth.verifyIdToken(token);
    return 'ok';
  } catch {
    return 'unauthorized';
  }
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return jsonError(503, 'O assistente de áudio não está disponível de momento.');
  }

  const authResult = await verifyUser(request);
  if (authResult === 'unavailable') {
    return jsonError(503, 'O assistente de áudio não está disponível de momento.');
  }
  if (authResult === 'unauthorized') {
    return jsonError(401, 'Inicie sessão para usar o assistente de áudio.');
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError(400, 'Pedido inválido.');
  }

  const kindRaw = form.get('kind');
  const kind: AudioListingKind = kindRaw === 'peca' ? 'peca' : 'carro';
  const audio = form.get('audio');
  if (!(audio instanceof File) || audio.size === 0) {
    return jsonError(400, 'Nenhum áudio recebido.');
  }
  if (audio.size > AUDIO_MAX_BYTES) {
    return jsonError(413, `O áudio é demasiado grande (máx. ${AUDIO_MAX_MB} MB).`);
  }
  const mimeType = geminiAudioMimeType(audio.type, audio.name);
  if (!mimeType) {
    return jsonError(415, 'Formato de áudio não suportado. Use mp3, wav, m4a, aac, ogg ou flac.');
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  const data = Buffer.from(await audio.arrayBuffer()).toString('base64');

  let rawText: string | undefined;
  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: [{ inlineData: { mimeType, data } }, { text: buildAudioListingPrompt(kind) }],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: kind === 'peca' ? PART_AUDIO_RESPONSE_SCHEMA : CAR_AUDIO_RESPONSE_SCHEMA,
        temperature: 0,
      },
    });
    rawText = response.text;
  } catch (err) {
    console.error('[listing-from-audio] Gemini error:', err);
    return jsonError(502, 'Não foi possível interpretar o áudio. Tente novamente.');
  }

  let raw: unknown;
  try {
    raw = JSON.parse(rawText ?? '');
  } catch {
    return jsonError(502, 'Não foi possível interpretar o áudio. Tente novamente.');
  }

  const fields = kind === 'peca' ? sanitizePartFields(raw) : sanitizeCarFields(raw);
  const transcript =
    typeof (raw as { transcript?: unknown }).transcript === 'string'
      ? ((raw as { transcript: string }).transcript.trim().slice(0, 4000) || undefined)
      : undefined;

  return NextResponse.json({ kind, fields, transcript });
}
