'use client';

import { useCallback, useRef, useState } from 'react';
import { mapAiErrorToMessage } from '@/lib/ia/aiErrors';
import { callAnalyzeDamage } from '@/lib/ia/aiFunctions';
import type { DamageDetectionResult } from '@/types/ia';

/**
 * Gemini Vision damage analysis for a listing photo. The server caches the
 * result inside the car document (keyed by photo hash), so repeated calls on
 * the same photo are free; pass any pre-loaded cache via `initialResult`.
 */
export default function useDamageDetection(initialResult: DamageDetectionResult | null = null) {
  const [result, setResult] = useState<DamageDetectionResult | null>(initialResult);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const analyze = useCallback(
    async (carId: string, photoIndex: number): Promise<DamageDetectionResult | null> => {
      if (inFlightRef.current) return null;
      setError(null);
      inFlightRef.current = true;
      setLoading(true);
      try {
        const response = await callAnalyzeDamage({ carId, photoIndex });
        setResult(response.result);
        return response.result;
      } catch (err) {
        setError(mapAiErrorToMessage(err));
        return null;
      } finally {
        inFlightRef.current = false;
        setLoading(false);
      }
    },
    [],
  );

  return { analyze, result, loading, error };
}
