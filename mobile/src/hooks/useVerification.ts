import { useCallback, useEffect, useState } from 'react';
import { addVerification, getVerificationByUid } from '@/lib/db';
import type { Verification, VerificationInput } from '@/types';

/**
 * Loads the current user's latest verification request and exposes a submitter.
 * Mirrors the web `useVerification` hook.
 */
export function useVerification(uid: string | undefined) {
  const [verification, setVerification] = useState<Verification | null>(null);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    if (!uid) {
      setVerification(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setVerification(await getVerificationByUid(uid));
    setLoading(false);
  }, [uid]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const pedir = useCallback(async (data: VerificationInput) => {
    const v = await addVerification(data);
    setVerification(v);
    return v;
  }, []);

  return { verification, loading, pedir, recarregar: carregar };
}
