import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  enviarMensagem as enviarMensagemDb,
  marcarMensagensLidas,
  subscribeMensagens,
} from '@/lib/chat';
import { useAuth } from './AuthContext';
import type { Conversa, ListingType, Mensagem } from '@/types';

interface EnviarParams {
  toUid: string;
  toNome: string;
  listingId: string;
  listingType: ListingType;
  listingTitle: string;
  texto: string;
}

interface ChatContextValue {
  mensagens: Mensagem[];
  conversas: Conversa[];
  mensagensNaoLidas: number;
  /** Messages for one conversation (listing + counterpart), chronological. */
  getConversa: (listingId: string, outroUid: string) => Mensagem[];
  enviar: (p: EnviarParams) => Promise<void>;
  marcarLidas: (mensagens: Mensagem[]) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

function derivarConversas(mensagens: Mensagem[], uid: string): Conversa[] {
  const mapa = new Map<string, Conversa>();
  for (const m of mensagens) {
    const outroUid = m.fromUid === uid ? m.toUid : m.fromUid;
    const outroNome = m.fromUid === uid ? m.toNome : m.fromNome;
    const chave = `${m.listingId}__${outroUid}`;
    const existente = mapa.get(chave);
    const naoLida = m.toUid === uid && !m.lida ? 1 : 0;
    if (!existente) {
      mapa.set(chave, {
        chaveConversa: chave,
        listingId: m.listingId,
        listingType: m.listingType,
        listingTitle: m.listingTitle,
        outroUid,
        outroNome,
        ultimaMensagem: m.mensagem,
        ultimaData: m.dataCriacao,
        naoLidas: naoLida,
      });
    } else {
      existente.naoLidas += naoLida;
      // `mensagens` is sorted ascending, so the last seen is the most recent.
      existente.ultimaMensagem = m.mensagem;
      existente.ultimaData = m.dataCriacao;
      existente.outroNome = outroNome;
    }
  }
  return Array.from(mapa.values()).sort(
    (a, b) => (b.ultimaData?.toMillis?.() ?? 0) - (a.ultimaData?.toMillis?.() ?? 0),
  );
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);

  useEffect(() => {
    if (!uid) {
      setMensagens([]);
      return;
    }
    const unsub = subscribeMensagens(uid, setMensagens, () => setMensagens([]));
    return unsub;
  }, [uid]);

  const conversas = useMemo(
    () => (uid ? derivarConversas(mensagens, uid) : []),
    [mensagens, uid],
  );

  const mensagensNaoLidas = useMemo(
    () => (uid ? mensagens.filter((m) => m.toUid === uid && !m.lida).length : 0),
    [mensagens, uid],
  );

  const getConversa = useCallback(
    (listingId: string, outroUid: string) =>
      mensagens.filter(
        (m) =>
          m.listingId === listingId &&
          (m.fromUid === outroUid || m.toUid === outroUid),
      ),
    [mensagens],
  );

  const enviar = useCallback(
    async (p: EnviarParams) => {
      if (!user) return;
      await enviarMensagemDb({
        fromUid: user.uid,
        fromNome: user.nome,
        toUid: p.toUid,
        toNome: p.toNome,
        listingId: p.listingId,
        listingType: p.listingType,
        listingTitle: p.listingTitle,
        texto: p.texto,
      });
    },
    [user],
  );

  const marcarLidas = useCallback(
    (lista: Mensagem[]) => {
      if (!uid) return;
      const ids = lista.filter((m) => m.toUid === uid && !m.lida).map((m) => m.id);
      if (ids.length) marcarMensagensLidas(ids).catch(() => {});
    },
    [uid],
  );

  const value = useMemo<ChatContextValue>(
    () => ({ mensagens, conversas, mensagensNaoLidas, getConversa, enviar, marcarLidas }),
    [mensagens, conversas, mensagensNaoLidas, getConversa, enviar, marcarLidas],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat deve ser usado dentro de <ChatProvider>.');
  return ctx;
}
