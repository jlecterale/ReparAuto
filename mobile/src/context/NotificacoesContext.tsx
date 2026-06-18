import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  marcarNotificacaoLida,
  marcarTodasNotificacoesLidas,
  subscribeNotificacoes,
} from '@/lib/chat';
import { useAuth } from './AuthContext';
import type { Notificacao } from '@/types';

interface NotificacoesContextValue {
  notificacoes: Notificacao[];
  naoLidas: number;
  marcarLida: (id: string) => void;
  marcarTodasLidas: () => void;
}

const NotificacoesContext = createContext<NotificacoesContextValue | null>(null);

export function NotificacoesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);

  useEffect(() => {
    if (!uid) {
      setNotificacoes([]);
      return;
    }
    const unsub = subscribeNotificacoes(uid, setNotificacoes, () => setNotificacoes([]));
    return unsub;
  }, [uid]);

  const naoLidas = useMemo(
    () => notificacoes.filter((n) => !n.lida).length,
    [notificacoes],
  );

  const value = useMemo<NotificacoesContextValue>(
    () => ({
      notificacoes,
      naoLidas,
      marcarLida: (id: string) => {
        marcarNotificacaoLida(id).catch(() => {});
      },
      marcarTodasLidas: () => {
        if (uid) marcarTodasNotificacoesLidas(uid).catch(() => {});
      },
    }),
    [notificacoes, naoLidas, uid],
  );

  return (
    <NotificacoesContext.Provider value={value}>{children}</NotificacoesContext.Provider>
  );
}

export function useNotificacoes(): NotificacoesContextValue {
  const ctx = useContext(NotificacoesContext);
  if (!ctx) throw new Error('useNotificacoes deve ser usado dentro de <NotificacoesProvider>.');
  return ctx;
}
