'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { subscribeNotificacoes, marcarNotificacaoLida, marcarTodasNotificacoesLidas } from '@/lib/db';
import type { Notificacao } from '@/types/notificacao';

export default function useNotificacoes(uid: string | undefined) {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setNotificacoes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeNotificacoes(
      uid,
      (data) => {
        setNotificacoes(data);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [uid]);

  const marcarLida = useCallback(async (id: string) => {
    await marcarNotificacaoLida(id);
    setNotificacoes((prev) => prev.map((n) => (n.id === id ? { ...n, lida: true } : n)));
  }, []);

  const marcarTodasLidas = useCallback(async () => {
    if (!uid) return;
    await marcarTodasNotificacoesLidas(uid);
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
  }, [uid]);

  const naoLidas = useMemo(() => notificacoes.filter((n) => !n.lida).length, [notificacoes]);

  return useMemo(() => ({
    notificacoes,
    naoLidas,
    loading,
    marcarLida,
    marcarTodasLidas,
  }), [notificacoes, naoLidas, loading, marcarLida, marcarTodasLidas]);
}
