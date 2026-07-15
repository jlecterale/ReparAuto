/**
 * Typed wrappers around the AI Cloud Function callables (plan 4.1), pinned to
 * the deployed region. The mobile client never talks to the model — these just
 * relay to the shared proxy that owns auth, quota, sanitization and validation.
 */
import { getApp } from '@react-native-firebase/app';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';
import type {
  AIDescriptionRequest,
  AIDescriptionResponse,
  AIPriceSuggestionRequest,
  AIPriceSuggestionResponse,
  DamageDetectionResponse,
} from '@/types';

const FUNCTIONS_REGION = 'europe-west1';

function callable<Req, Res>(name: string) {
  const instance = getFunctions(getApp(), FUNCTIONS_REGION);
  return httpsCallable<Req, Res>(instance, name);
}

export async function callGenerateDescription(
  request: AIDescriptionRequest,
): Promise<AIDescriptionResponse> {
  const res = await callable<AIDescriptionRequest, AIDescriptionResponse>('generateDescription')(request);
  return res.data;
}

export async function callSuggestPrice(
  request: AIPriceSuggestionRequest,
): Promise<AIPriceSuggestionResponse> {
  const res = await callable<AIPriceSuggestionRequest, AIPriceSuggestionResponse>('suggestPrice')(request);
  return res.data;
}

export async function callAnalyzeDamage(
  request: { carId: string; photoIndex: number },
): Promise<DamageDetectionResponse> {
  const res = await callable<{ carId: string; photoIndex: number }, DamageDetectionResponse>('analyzeDamage')(request);
  return res.data;
}
