import { useState, useEffect, useCallback } from 'react';
import { getNotificacoes, marcarNotificacaoLida, marcarTodasNotificacoesLidas } from '@/lib/db';
import type { Notificacao } from '@/types/notificacao';

export default function useNotificacoes(uid: string | undefined) {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    if (!uid) {
      setNotificacoes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await getNotificacoes(uid);
    setNotificacoes(data);
    setLoading(false);
  }, [uid]);

  useEffect(() => {
    carregar();
    const interval = setInterval(() => { carregar(); }, 30000);
    return () => clearInterval(interval);
  }, [carregar]);

  const marcarLida = useCallback(async (id: string) => {
    await marcarNotificacaoLida(id);
    setNotificacoes((prev) => prev.map((n) => (n.id === id ? { ...n, lida: true } : n)));
  }, []);

  const marcarTodasLidas = useCallback(async () => {
    if (!uid) return;
    await marcarTodasNotificacoesLidas(uid);
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
  }, [uid]);

  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  return {
    notificacoes,
    naoLidas,
    loading,
    marcarLida,
    marcarTodasLidas,
    recarregar: carregar,
  };
}
