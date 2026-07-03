import { useCallback, useEffect, useState } from 'react';
import { apagarAlerta, atualizarAlerta, criarAlerta, subscribeAlertas } from '@/lib/alerts';
import { MAX_ALERT_SUBSCRIPTIONS } from '@/lib/alertsSanitize';
import type { AlertSubscription, AlertSubscriptionInput } from '@/types';

/**
 * Live CRUD over the signed-in user's alert subscriptions (plan 3.1).
 * Mirrors the web `useAlertSubscriptions` hook.
 */
export function useAlertSubscriptions(uid: string | undefined) {
  const [alertas, setAlertas] = useState<AlertSubscription[]>([]);
  const [loading, setLoading] = useState(!!uid);

  useEffect(() => {
    if (!uid) {
      setAlertas([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeAlertas(
      uid,
      (data) => {
        setAlertas(data);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [uid]);

  const criar = useCallback(
    (input: AlertSubscriptionInput): Promise<AlertSubscription> => {
      if (!uid) return Promise.reject(new Error('auth/not-signed-in'));
      return criarAlerta(uid, input);
    },
    [uid],
  );

  const atualizar = useCallback(
    (id: string, updates: Partial<Pick<AlertSubscription, 'nome' | 'ativo' | 'novosResultados'>>) =>
      atualizarAlerta(id, updates),
    [],
  );

  const remover = useCallback((id: string) => apagarAlerta(id), []);

  return {
    alertas,
    loading,
    criar,
    atualizar,
    remover,
    limite: MAX_ALERT_SUBSCRIPTIONS,
    atLimit: alertas.length >= MAX_ALERT_SUBSCRIPTIONS,
    novosResultados: alertas.reduce((sum, a) => sum + (a.novosResultados || 0), 0),
  };
}
