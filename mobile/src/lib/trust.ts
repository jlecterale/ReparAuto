/**
 * Phase 5 data access: purchase intents, reviews and reports.
 * Public reads are open (`allow read: if true`); writes follow the same shape
 * the security rules expect (intents/reviews/reports created as `pendente`).
 */
import firestore from '@react-native-firebase/firestore';
import { db } from './firebase';
import type { IntencaoCompra, Review } from '@/types';

const INTENCOES = 'intencoes_compra';
const REVIEWS = 'reviews';
const REPORTS = 'reports';

function sortDesc<T extends { dataCriacao?: { toMillis?: () => number } }>(a: T, b: T) {
  return (b.dataCriacao?.toMillis?.() ?? 0) - (a.dataCriacao?.toMillis?.() ?? 0);
}

// ---------- Intenções ----------
export function subscribeIntencoesAtivas(
  onData: (i: IntencaoCompra[]) => void,
  onError?: (e: Error) => void,
): () => void {
  return db
    .collection(INTENCOES)
    .where('status', '==', 'ativa')
    .onSnapshot(
      (snap) => {
        const lista = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as IntencaoCompra)
          .sort((a, b) => (b.criadaEm?.toMillis?.() ?? 0) - (a.criadaEm?.toMillis?.() ?? 0));
        onData(lista);
      },
      (err) => onError?.(err),
    );
}

export async function getIntencaoById(id: string): Promise<IntencaoCompra | null> {
  const doc = await db.collection(INTENCOES).doc(id).get();
  if (!doc.exists()) return null;
  // best-effort view counter (stats-only update is whitelisted by rules)
  db.collection(INTENCOES)
    .doc(id)
    .update({ 'stats.visualizacoes': firestore.FieldValue.increment(1) })
    .catch(() => {});
  return { id: doc.id, ...doc.data() } as IntencaoCompra;
}

export async function getIntencoesByUser(userId: string): Promise<IntencaoCompra[]> {
  const snap = await db.collection(INTENCOES).where('userId', '==', userId).get();
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as IntencaoCompra)
    .sort((a, b) => (b.criadaEm?.toMillis?.() ?? 0) - (a.criadaEm?.toMillis?.() ?? 0));
}

export async function criarIntencao(dados: Record<string, unknown>): Promise<string> {
  const ref = db.collection(INTENCOES).doc();
  await ref.set({
    id: ref.id,
    ...dados,
    status: 'pendente',
    prioritaria: false,
    stats: { visualizacoes: 0, visualizacoes7Dias: 0, contatos: 0, contatos7Dias: 0 },
    criadaEm: firestore.FieldValue.serverTimestamp(),
    atualizadaEm: firestore.FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function deleteIntencao(id: string): Promise<void> {
  await db.collection(INTENCOES).doc(id).delete();
}

// ---------- Reviews ----------
export function subscribeReviews(
  anuncioId: string,
  onData: (r: Review[]) => void,
  onError?: (e: Error) => void,
): () => void {
  return db
    .collection(REVIEWS)
    .where('anuncioId', '==', anuncioId)
    .where('status', '==', 'aprovado')
    .onSnapshot(
      (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Review).sort(sortDesc)),
      (err) => onError?.(err),
    );
}

interface NovaReview {
  autorUid: string;
  autorNome: string;
  autorFoto: string | null;
  vendedorUid: string;
  vendedorEmail: string;
  anuncioId: string;
  anuncioTipo: 'carro' | 'peca' | 'oficina';
  nota: number;
  comentario: string;
}

export async function addReview(r: NovaReview): Promise<void> {
  await db.collection(REVIEWS).add({
    ...r,
    status: 'pendente',
    dataCriacao: firestore.FieldValue.serverTimestamp(),
  });
}

// ---------- Reports ----------
interface NovoReport {
  denuncianteUid: string;
  denuncianteEmail: string;
  alvoId: string;
  alvoTipo: 'carro' | 'peca' | 'utilizador';
  motivo: string;
  descricao: string;
}

export async function addReport(r: NovoReport): Promise<void> {
  await db.collection(REPORTS).add({
    ...r,
    status: 'pendente',
    dataCriacao: firestore.FieldValue.serverTimestamp(),
  });
}
