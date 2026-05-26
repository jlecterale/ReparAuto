import { useState, useCallback, useEffect } from 'react';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Mensagem, ListingType } from '@/types/chat';

const MENSAGENS_COLLECTION = 'messages';

export function useChat(uid: string | null) {
  const [mensagensNaoLidas, setMensagensNaoLidas] = useState(0);
  const [chatAberto, setChatAberto] = useState(false);
  const [chatListingId, setChatListingId] = useState<string | null>(null);
  const [chatListingType, setChatListingType] = useState<ListingType | null>(null);
  const [chatListingTitle, setChatListingTitle] = useState('');
  const [chatVendedorUid, setChatVendedorUid] = useState('');
  const [chatVendedorNome, setChatVendedorNome] = useState('');
  const [conversa, setConversa] = useState<Mensagem[]>([]);
  const [carregandoConversa, setCarregandoConversa] = useState(false);

  const recarregarMensagensNaoLidas = useCallback(async () => {
    if (!uid) { setMensagensNaoLidas(0); return; }
    try {
      const q = query(
        collection(db, MENSAGENS_COLLECTION),
        where('toUid', '==', uid),
        where('lida', '==', false),
      );
      const snap = await getDocs(q);
      setMensagensNaoLidas(snap.size);
    } catch {
      setMensagensNaoLidas(0);
    }
  }, [uid]);

  useEffect(() => {
    recarregarMensagensNaoLidas();
  }, [recarregarMensagensNaoLidas]);

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
      try {
        await addDoc(collection(db, MENSAGENS_COLLECTION), {
          listingId: chatListingId,
          listingType: chatListingType,
          listingTitle: chatListingTitle,
          fromUid: uid,
          fromNome: uid,
          toUid: chatVendedorUid,
          toNome: chatVendedorNome,
          mensagem: texto.trim(),
          lida: false,
          dataCriacao: Timestamp.now(),
        });
      } catch (err) {
        console.error('[Chat] Erro ao enviar mensagem:', err);
      }
    },
    [uid, chatListingId, chatListingType, chatListingTitle, chatVendedorUid, chatVendedorNome],
  );

  const carregarConversa = useCallback(async () => {
    if (!uid || !chatVendedorUid || !chatListingId) { setConversa([]); return; }
    setCarregandoConversa(true);
    try {
      const q = query(
        collection(db, MENSAGENS_COLLECTION),
        where('listingId', '==', chatListingId),
        orderBy('dataCriacao', 'asc'),
      );
      const snap = await getDocs(q);
      const msgs = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Mensagem))
        .filter((m) => (m.fromUid === uid && m.toUid === chatVendedorUid) || (m.fromUid === chatVendedorUid && m.toUid === uid));
      setConversa(msgs);
    } catch {
      setConversa([]);
    }
    setCarregandoConversa(false);
  }, [uid, chatVendedorUid, chatListingId]);

  useEffect(() => {
    if (chatAberto) {
      carregarConversa();
    }
  }, [chatAberto, carregarConversa]);

  return {
    mensagensNaoLidas,
    recarregarMensagensNaoLidas,
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
  };
}
