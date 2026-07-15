'use client';

import { useCallback, useRef, useState } from 'react';
import { aiCacheKey, getCachedAiResult, setCachedAiResult } from '@/lib/ia/aiCache';
import { mapAiErrorToMessage } from '@/lib/ia/aiErrors';
import { callSuggestPrice } from '@/lib/ia/aiFunctions';
import { getStoredAiRemaining, storeAiRemaining, weekKeyFromDate } from '@/lib/ia/aiQuota';
import type { AIPriceSuggestionRequest, AIPriceSuggestionResponse } from '@/types/ia';

/**
 * AI price suggestion (market-anchored) through the Cloud Function proxy,
 * with local idempotency cache and quota mirroring.
 */
export default function useAIPriceSuggestion(uid?: string) {
  const [suggestion, setSuggestion] = useState<AIPriceSuggestionResponse | null>(null);
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

  const suggest = useCallback(
    async (input: AIPriceSuggestionRequest): Promise<AIPriceSuggestionResponse | null> => {
      if (inFlightRef.current) return null;
      setError(null);

      const key = aiCacheKey('price', input);
      const cached = getCachedAiResult<AIPriceSuggestionResponse>(key);
      if (cached) {
        setSuggestion(cached);
        return cached;
      }

      inFlightRef.current = true;
      setLoading(true);
      try {
        const response = await callSuggestPrice(input);
        setCachedAiResult(key, response);
        updateRemaining(response.remaining);
        setSuggestion(response);
        return response;
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

  return { suggest, suggestion, loading, error, remaining };
}
