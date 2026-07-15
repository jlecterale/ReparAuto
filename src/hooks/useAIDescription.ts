'use client';

import { useCallback, useRef, useState } from 'react';
import { aiCacheKey, getCachedAiResult, setCachedAiResult } from '@/lib/ia/aiCache';
import { mapAiErrorToMessage } from '@/lib/ia/aiErrors';
import { callGenerateDescription } from '@/lib/ia/aiFunctions';
import { getStoredAiRemaining, storeAiRemaining, weekKeyFromDate } from '@/lib/ia/aiQuota';
import type { AIDescriptionRequest, AIDescriptionResponse } from '@/types/ia';

/**
 * AI ad-description generation through the Cloud Function proxy.
 * Identical inputs are served from the local idempotency cache without
 * spending a generation; `remaining` mirrors the server's weekly quota.
 */
export default function useAIDescription(uid?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(() =>
    uid ? getStoredAiRemaining(uid, weekKeyFromDate(new Date())) : null,
  );
  const inFlightRef = useRef(false);

  const updateRemaining = useCallback(
    (value: number) => {
      setRemaining(value);
      if (uid) storeAiRemaining(uid, weekKeyFromDate(new Date()), value);
    },
    [uid],
  );

  const generate = useCallback(
    async (input: AIDescriptionRequest): Promise<string | null> => {
      if (inFlightRef.current) return null;
      setError(null);

      const key = aiCacheKey('description', input);
      const cached = getCachedAiResult<AIDescriptionResponse>(key);
      if (cached) return cached.description;

      inFlightRef.current = true;
      setLoading(true);
      try {
        const response = await callGenerateDescription(input);
        setCachedAiResult(key, response);
        updateRemaining(response.remaining);
        return response.description;
      } catch (err) {
        setError(mapAiErrorToMessage(err));
        if ((err as { code?: string } | null)?.code === 'functions/resource-exhausted') {
          updateRemaining(0);
        }
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
