/**
 * Typed wrappers around the AI Cloud Function callables (plan 4.1).
 * Lazy singleton Functions instance pinned to the deployed region.
 */
import { getFunctions, httpsCallable, type Functions } from 'firebase/functions';
import app from '@/lib/firebase';
import type {
  AIDescriptionRequest,
  AIDescriptionResponse,
  AIPriceSuggestionRequest,
  AIPriceSuggestionResponse,
  DamageDetectionRequest,
  DamageDetectionResponse,
} from '@/types/ia';

const FUNCTIONS_REGION = 'europe-west1';

let functionsInstance: Functions | null = null;

function getFunctionsInstance(): Functions {
  if (!functionsInstance) {
    functionsInstance = getFunctions(app, FUNCTIONS_REGION);
  }
  return functionsInstance;
}

async function call<Req, Res>(name: string, payload: Req): Promise<Res> {
  const callable = httpsCallable<Req, Res>(getFunctionsInstance(), name);
  const result = await callable(payload);
  return result.data;
}

export function callGenerateDescription(
  request: AIDescriptionRequest,
): Promise<AIDescriptionResponse> {
  return call('generateDescription', request);
}

export function callSuggestPrice(
  request: AIPriceSuggestionRequest,
): Promise<AIPriceSuggestionResponse> {
  return call('suggestPrice', request);
}

export function callAnalyzeDamage(
  request: DamageDetectionRequest,
): Promise<DamageDetectionResponse> {
  return call('analyzeDamage', request);
}
