'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  addAlertSubscription,
  deleteAlertSubscription,
  subscribeAlertSubscriptions,
  updateAlertSubscription,
} from '@/lib/db';
import { MAX_ALERT_SUBSCRIPTIONS } from '@/lib/alerts';
import type { AlertSubscription, AlertSubscriptionInput } from '@/types/alertas';

/**
 * Live CRUD over the signed-in user's alert subscriptions (plan 3.1).
 * The list is realtime (onSnapshot); mutations go through src/lib/db.ts,
 * which sanitizes input and enforces the per-user cap.
 */
export default function useAlertSubscriptions(uid: string | undefined) {
  const [alertas, setAlertas] = useState<AlertSubscription[]>([]);
  const [loading, setLoading] = useState(!!uid);

  useEffect(() => {
    if (!uid) {
      setAlertas([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = subscribeAlertSubscriptions(
      uid,
      (subs) => {
        setAlertas(subs);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsubscribe;
  }, [uid]);

  const criar = useCallback(
    async (input: AlertSubscriptionInput): Promise<AlertSubscription> => {
      if (!uid) throw new Error('auth/not-signed-in');
      return addAlertSubscription(uid, input);
    },
    [uid],
  );

  const atualizar = useCallback(
    (id: string, updates: Partial<Pick<AlertSubscription, 'nome' | 'ativo' | 'novosResultados'>>) =>
      updateAlertSubscription(id, updates),
    [],
  );

  const remover = useCallback((id: string) => deleteAlertSubscription(id), []);

  return useMemo(
    () => ({
      alertas,
      loading,
      criar,
      atualizar,
      remover,
      limite: MAX_ALERT_SUBSCRIPTIONS,
      atLimit: alertas.length >= MAX_ALERT_SUBSCRIPTIONS,
    }),
    [alertas, loading, criar, atualizar, remover],
  );
}
