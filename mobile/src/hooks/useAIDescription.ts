import { useCallback, useEffect, useRef, useState } from 'react';
import { aiCacheKey, getCachedAiResult, setCachedAiResult } from '@/lib/ia/aiCache';
import { isQuotaError, mapAiErrorToMessage } from '@/lib/ia/aiErrors';
import { callGenerateDescription } from '@/lib/ia/aiFunctions';
import { getStoredAiRemaining, storeAiRemaining, weekKeyFromDate } from '@/lib/ia/aiQuota';
import type { AIDescriptionRequest, AIDescriptionResponse } from '@/types';

/**
 * AI ad-description generation through the Cloud Function proxy. Identical
 * inputs are served from the local idempotency cache without spending a
 * generation; `remaining` mirrors the server's weekly quota.
 */
export function useAIDescription(uid?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const inFlightRef = useRef(false);

  // AsyncStorage is async — hydrate the UX quota mirror on mount.
  useEffect(() => {
    if (!uid) return;
    let active = true;
    getStoredAiRemaining(uid, weekKeyFromDate(new Date())).then((v) => {
      if (active && v !== null) setRemaining(v);
    });
    return () => {
      active = false;
    };
  }, [uid]);

  const updateRemaining = useCallback(
    (value: number) => {
      setRemaining(value);
      if (uid) void storeAiRemaining(uid, weekKeyFromDate(new Date()), value);
    },
    [uid],
  );

  const generate = useCallback(
    async (input: AIDescriptionRequest): Promise<string | null> => {
      if (inFlightRef.current) return null;
      setError(null);

      const key = aiCacheKey('description', input);
      const cached = await getCachedAiResult<AIDescriptionResponse>(key);
      if (cached) return cached.description;

      inFlightRef.current = true;
      setLoading(true);
      try {
        const response = await callGenerateDescription(input);
        await setCachedAiResult(key, response);
        updateRemaining(response.remaining);
        return response.description;
      } catch (err) {
        setError(mapAiErrorToMessage(err));
        if (isQuotaError(err)) updateRemaining(0);
        return null;
      } finally {
        inFlightRef.current = false;
        setLoading(false);
      }
    },
    [updateRemaining],
  );

  return { generate, loading, error, remaining };
}
