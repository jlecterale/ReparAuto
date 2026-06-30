'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Timestamp } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import {
  subscribeClients,
  createClient,
  createClientsBatch,
  updateClient,
  deleteClient,
} from '@/lib/db';
import type { Client, ClientInput } from '@/types/client';

interface MatchResponse {
  matched: boolean;
  uid?: string;
  nome?: string;
  foto?: string | null;
}

/** Asks the server whether an email belongs to a RecarGarage account. */
async function lookupMatch(email: string): Promise<MatchResponse> {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) return { matched: false };
    const res = await fetch('/api/clients/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) return { matched: false };
    return (await res.json()) as MatchResponse;
  } catch {
    return { matched: false };
  }
}

export default function useClients(ownerUid: string | null | undefined) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ownerUid) {
      setClients([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeClients(
      ownerUid,
      (list) => {
        setClients(list);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [ownerUid]);

  // Resolve an email match and persist the result onto the client record.
  // A blank email clears any previous match instead of leaving it stale.
  const refreshMatch = useCallback(async (clientId: string, email: string | undefined) => {
    const trimmed = (email || '').trim();
    if (!trimmed) {
      await updateClient(clientId, { matchedUserUid: null, matchedAt: null });
      return;
    }
    const result = await lookupMatch(trimmed);
    await updateClient(clientId, {
      matchedUserUid: result.matched ? result.uid ?? null : null,
      matchedAt: result.matched ? Timestamp.now() : null,
    });
  }, []);

  const add = useCallback(
    async (data: ClientInput): Promise<string> => {
      if (!ownerUid) throw new Error('Sem sessão');
      const id = await createClient(ownerUid, data);
      if (data.email) void refreshMatch(id, data.email);
      return id;
    },
    [ownerUid, refreshMatch],
  );

  const importBatch = useCallback(
    async (list: ClientInput[]): Promise<number> => {
      if (!ownerUid) throw new Error('Sem sessão');
      return createClientsBatch(ownerUid, list);
    },
    [ownerUid],
  );

  const update = useCallback(
    async (id: string, data: Partial<Client>, emailChanged?: boolean): Promise<void> => {
      await updateClient(id, data);
      if (emailChanged) void refreshMatch(id, data.email);
    },
    [refreshMatch],
  );

  const remove = useCallback(async (id: string): Promise<void> => {
    await deleteClient(id);
  }, []);

  return useMemo(
    () => ({ clients, loading, add, importBatch, update, remove }),
    [clients, loading, add, importBatch, update, remove],
  );
}
