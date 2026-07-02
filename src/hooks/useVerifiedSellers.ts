'use client';

import { useEffect, useMemo, useState } from 'react';
import { getVerifiedUids } from '@/lib/db';
import { collectSellerUids } from '@/lib/sellers';

// Session-wide cache (uid → verified?) shared by every hook instance, so the
// cars and parts lists don't re-query the same sellers. `pending` prevents
// duplicate in-flight fetches for the same uid.
const cache = new Map<string, boolean>();
const pending = new Set<string>();

/** Test-only: resets the module-level cache between test cases. */
export function clearSellerVerificationCache(): void {
  cache.clear();
  pending.clear();
}

/**
 * Resolves which sellers of the given listings are verified (users.verificado).
 * Returns a Set of verified uids that fills in as profiles load.
 */
export default function useVerifiedSellers(items: readonly { criadorUid?: string }[]): Set<string> {
  const uidsKey = useMemo(() => collectSellerUids(items).join(','), [items]);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const uids = uidsKey ? uidsKey.split(',') : [];
    const unknown = uids.filter((uid) => !cache.has(uid) && !pending.has(uid));
    if (unknown.length === 0) return;

    let cancelled = false;
    unknown.forEach((uid) => pending.add(uid));
    getVerifiedUids(unknown)
      .then((verified) => {
        const verifiedSet = new Set(verified);
        unknown.forEach((uid) => cache.set(uid, verifiedSet.has(uid)));
        if (!cancelled) setVersion((v) => v + 1);
      })
      .catch(() => {
        // Leave the uids unresolved; a later mount retries. Badges/priority
        // degrade gracefully to "not verified".
      })
      .finally(() => {
        unknown.forEach((uid) => pending.delete(uid));
      });
    return () => {
      cancelled = true;
    };
  }, [uidsKey]);

  // `version` bumps when a fetch resolves, so the set is rebuilt from the
  // cache and late-arriving results are always reflected.
  return useMemo(() => {
    void version;
    const uids = uidsKey ? uidsKey.split(',') : [];
    return new Set(uids.filter((uid) => cache.get(uid) === true));
  }, [uidsKey, version]);
}
