'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  collection,
  addDoc,
  doc,
  writeBatch,
  query,
  where,
  onSnapshot,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { incrementCampo } from '@/lib/db';
import type { Mensagem, ListingType } from '@/types/chat';

const MENSAGENS_COLLECTION = 'messages';
const NOTIFICACOES_COLLECTION = 'notifications';

export function useChat(uid: string | null, nome: string = '') {
  const [mensagensNaoLidas, setMensagensNaoLidas] = useState(0);
  const [chatAberto, setChatAberto] = useState(false);
  const [chatListingId, setChatListingId] = useState<string | null>(null);
  const [chatListingType, setChatListingType] = useState<ListingType | null>(null);
  const [chatListingTitle, setChatListingTitle] = useState('');
  const [chatVendedorUid, setChatVendedorUid] = useState('');
  const [chatVendedorNome, setChatVendedorNome] = useState('');
  const [conversa, setConversa] = useState<Mensagem[]>([]);
  const [carregandoConversa, setCarregandoConversa] = useState(false);

  const unsubNaoLidas = useRef<Unsubscribe | null>(null);
  const unsubConversa = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    if (unsubNaoLidas.current) {
      unsubNaoLidas.current();
      unsubNaoLidas.current = null;
    }
    if (!uid) {
      setMensagensNaoLidas(0);
      return;
    }
    // Equality-only filters are served by merging single-field indexes, so
    // the badge only streams the user's unread messages.
    const q = query(
      collection(db, MENSAGENS_COLLECTION),
      where('toUid', '==', uid),
      where('lida', '==', false),
    );
    unsubNaoLidas.current = onSnapshot(
      q,
      (snap) => {
        setMensagensNaoLidas(snap.size);
      },
      (err) => {
        console.error('[Chat] Erro ao ouvir mensagens não lidas:', err);
        setMensagensNaoLidas(0);
      },
    );
    return () => {
      if (unsubNaoLidas.current) {
        unsubNaoLidas.current();
        unsubNaoLidas.current = null;
      }
    };
  }, [uid]);

  useEffect(() => {
    if (unsubConversa.current) {
      unsubConversa.current();
      unsubConversa.current = null;
    }
    if (!chatAberto || !uid || !chatVendedorUid || !chatListingId) {
      setConversa([]);
      setCarregandoConversa(false);
      return;
    }
    setCarregandoConversa(true);
    const q = query(
      collection(db, MENSAGENS_COLLECTION),
      where('participants', 'array-contains', uid),
      where('listingId', '==', chatListingId),
    );
    unsubConversa.current = onSnapshot(
      q,
      (snap) => {
        const msgs = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as Mensagem)
          .sort((a, b) => a.dataCriacao.toMillis() - b.dataCriacao.toMillis());
        setConversa(msgs);
        setCarregandoConversa(false);
      },
      (err) => {
        console.error('[Chat] Erro ao ouvir conversa:', err);
        setConversa([]);
        setCarregandoConversa(false);
      },
    );
    return () => {
      if (unsubConversa.current) {
        unsubConversa.current();
        unsubConversa.current = null;
      }
      setConversa([]);
      setCarregandoConversa(true);
    };
  }, [chatAberto, uid, chatVendedorUid, chatListingId]);

  useEffect(() => {
    if (!uid || !chatAberto || conversa.length === 0) return;
    const unreadIds = conversa
      .filter((m) => m.toUid === uid && !m.lida)
      .map((m) => m.id);
    if (unreadIds.length === 0) return;
    const batch = writeBatch(db);
    unreadIds.forEach((id) => {
      batch.update(doc(db, MENSAGENS_COLLECTION, id), { lida: true });
    });
    batch.commit().catch((err) => {
      console.error('[Chat] Erro ao marcar mensagens como lidas:', err);
    });
  }, [uid, chatAberto, conversa]);

  const abrirChat = useCallback(
    (listingId: string, listingType: ListingType, listingTitle: string, vendedorUid: string, vendedorNome: string) => {
      setChatListingId(listingId);
      setChatListingType(listingType);
      setChatListingTitle(listingTitle);
      setChatVendedorUid(vendedorUid);
      setChatVendedorNome(vendedorNome);
      setChatAberto(true);
      setConversa([]);
    },
    [],
  );

  const fecharChat = useCallback(() => {
    setChatAberto(false);
    setChatListingId(null);
    setChatListingType(null);
    setChatListingTitle('');
    setChatVendedorUid('');
    setChatVendedorNome('');
    setConversa([]);
  }, []);

  const enviarMensagem = useCallback(
    async (texto: string) => {
      if (!uid || !chatListingId || !chatListingType || !chatVendedorUid || !texto.trim()) return;
      const trimmed = texto.trim();
      const participants = [uid, chatVendedorUid].sort();
      try {
        await addDoc(collection(db, MENSAGENS_COLLECTION), {
          listingId: chatListingId,
          listingType: chatListingType,
          listingTitle: chatListingTitle,
          fromUid: uid,
          fromNome: nome || uid,
          toUid: chatVendedorUid,
          toNome: chatVendedorNome,
          participants,
          mensagem: trimmed,
          lida: false,
          dataCriacao: Timestamp.now(),
        });
        if (chatListingType === 'intencao') {
          await incrementCampo('intencoes_compra', chatListingId, 'stats.contatos');
        } else {
          await incrementCampo(
            chatListingType === 'carro' ? 'cars' : 'parts',
            chatListingId,
            'contagemMensagens',
          );
        }
      } catch (err) {
        console.error('[Chat] Erro ao enviar mensagem:', err);
        throw err;
      }
      if (uid !== chatVendedorUid) {
        try {
          await addDoc(collection(db, NOTIFICACOES_COLLECTION), {
            uid: chatVendedorUid,
            tipo: 'mensagem',
            titulo: `Nova mensagem de ${nome || 'Alguém'}`,
            mensagem: trimmed.length > 100 ? trimmed.substring(0, 97) + '...' : trimmed,
            lida: false,
            dataCriacao: Timestamp.now(),
            link: null,
          });
        } catch (err) {
          console.warn('[Chat] Notificação não criada (não crítico):', err);
        }
      }
    },
    [uid, nome, chatListingId, chatListingType, chatListingTitle, chatVendedorUid, chatVendedorNome],
  );

  return useMemo(() => ({
    mensagensNaoLidas,
    abrirChat,
    chatAberto,
    fecharChat,
    chatListingId,
    chatListingType,
    chatListingTitle,
    chatVendedorUid,
    chatVendedorNome,
    enviarMensagem,
    conversa,
    carregandoConversa,
  }), [
    mensagensNaoLidas,
    abrirChat,
    chatAberto,
    fecharChat,
    chatListingId,
    chatListingType,
    chatListingTitle,
    chatVendedorUid,
    chatVendedorNome,
    enviarMensagem,
    conversa,
    carregandoConversa,
  ]);
}
