/**
 * Chat + notifications data access (ports the web `useChat` / notification
 * helpers to react-native-firebase).
 *
 * Index-safe by design: the only realtime message query is
 * `participants array-contains uid` (a single-field index). The inbox list and
 * each conversation are derived in memory from that one stream, so no composite
 * index is required.
 */
import firestore from '@react-native-firebase/firestore';
import { db } from './firebase';
import type { ListingType, Mensagem, Notificacao } from '@/types';

const MESSAGES = 'messages';
const NOTIFICATIONS = 'notifications';

// ---------- Messages ----------
export function subscribeMensagens(
  uid: string,
  onData: (mensagens: Mensagem[]) => void,
  onError?: (err: Error) => void,
): () => void {
  return db
    .collection(MESSAGES)
    .where('participants', 'array-contains', uid)
    .onSnapshot(
      (snap) => {
        const msgs = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as Mensagem)
          .sort((a, b) => (a.dataCriacao?.toMillis?.() ?? 0) - (b.dataCriacao?.toMillis?.() ?? 0));
        onData(msgs);
      },
      (err) => onError?.(err),
    );
}

interface EnviarMensagemParams {
  fromUid: string;
  fromNome: string;
  toUid: string;
  toNome: string;
  listingId: string;
  listingType: ListingType;
  listingTitle: string;
  texto: string;
}

export async function enviarMensagem(p: EnviarMensagemParams): Promise<void> {
  const trimmed = p.texto.trim();
  if (!trimmed || p.fromUid === p.toUid) return;
  const participants = [p.fromUid, p.toUid].sort();

  await db.collection(MESSAGES).add({
    listingId: p.listingId,
    listingType: p.listingType,
    listingTitle: p.listingTitle,
    fromUid: p.fromUid,
    fromNome: p.fromNome || p.fromUid,
    toUid: p.toUid,
    toNome: p.toNome,
    participants,
    mensagem: trimmed,
    lida: false,
    dataCriacao: firestore.FieldValue.serverTimestamp(),
  });

  // Bump the listing's message counter (best-effort; rules whitelist it).
  const colecao =
    p.listingType === 'carro' ? 'cars' : p.listingType === 'peca' ? 'parts' : null;
  if (colecao) {
    db.collection(colecao)
      .doc(p.listingId)
      .update({ contagemMensagens: firestore.FieldValue.increment(1) })
      .catch(() => {});
  }

  // Notify the recipient (in-app notification; rules allow 'mensagem' to others).
  // Deep-link straight to the conversation. From the recipient's perspective the
  // "other" participant is the sender, so we pass the sender's uid/name.
  const chatLink =
    `/chat/${encodeURIComponent(p.listingId)}` +
    `?listingType=${encodeURIComponent(p.listingType)}` +
    `&listingTitle=${encodeURIComponent(p.listingTitle)}` +
    `&outroUid=${encodeURIComponent(p.fromUid)}` +
    `&outroNome=${encodeURIComponent(p.fromNome || p.fromUid)}`;
  await db
    .collection(NOTIFICATIONS)
    .add({
      uid: p.toUid,
      tipo: 'mensagem',
      titulo: `Nova mensagem de ${p.fromNome || 'Alguém'}`,
      mensagem: trimmed.length > 100 ? `${trimmed.slice(0, 97)}...` : trimmed,
      lida: false,
      dataCriacao: firestore.FieldValue.serverTimestamp(),
      link: chatLink,
    })
    .catch(() => {});
}

export async function marcarMensagensLidas(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const batch = db.batch();
  ids.forEach((id) => batch.update(db.collection(MESSAGES).doc(id), { lida: true }));
  await batch.commit();
}

// ---------- Notifications ----------
export function subscribeNotificacoes(
  uid: string,
  onData: (n: Notificacao[]) => void,
  onError?: (err: Error) => void,
): () => void {
  return db
    .collection(NOTIFICATIONS)
    .where('uid', '==', uid)
    .onSnapshot(
      (snap) => {
        const lista = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as Notificacao)
          .sort((a, b) => (b.dataCriacao?.toMillis?.() ?? 0) - (a.dataCriacao?.toMillis?.() ?? 0));
        onData(lista);
      },
      (err) => onError?.(err),
    );
}

export async function marcarNotificacaoLida(id: string): Promise<void> {
  await db.collection(NOTIFICATIONS).doc(id).update({ lida: true }).catch(() => {});
}

export async function marcarTodasNotificacoesLidas(uid: string): Promise<void> {
  const snap = await db
    .collection(NOTIFICATIONS)
    .where('uid', '==', uid)
    .where('lida', '==', false)
    .get();
  if (snap.empty) return;
  const batch = db.batch();
  snap.docs.forEach((d) => batch.update(d.ref, { lida: true }));
  await batch.commit();
}
