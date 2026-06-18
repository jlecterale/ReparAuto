import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  where,
  setDoc,
  writeBatch,
  Timestamp,
  onSnapshot,
  increment,
  type DocumentData,
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import { contemProfanity } from './profanity';
import type { Carro, CarroInput, StatusAnuncio } from '@/types/carro';
import type { Peca, PecaInput } from '@/types/peca';
import type { Usuario, Role } from '@/types/usuario';
import type { Notificacao, TipoNotificacao } from '@/types/notificacao';
import type { Review, ReviewInput, StatusReview } from '@/types/review';
import type { Report, ReportInput, StatusReport } from '@/types/report';
import type { Verification, VerificationInput, StatusVerificacao } from '@/types/verification';
import type { IntencaoCompra, IntencaoCompraInput, ContatoIntencao, ContatoIntencaoInput, DenunciaIntencao } from '@/types/intencao';
import type { Proposta, PropostaInput, StatusProposta } from '@/types/proposal';
import type { LeadParceriaInput } from '@/types/lead';

const CARROS_COLLECTION = 'cars';
const PECAS_COLLECTION = 'parts';
const OFICINAS_COLLECTION = 'services';

// Public listings filter on status server-side so clients never download
// pending/rejected documents. Sorting stays client-side to avoid requiring
// a composite (status, dataCriacao) index.
function sortByDataCriacaoDesc<T extends { dataCriacao?: { toMillis?: () => number } }>(items: T[]): T[] {
  return items.sort((a, b) => (b.dataCriacao?.toMillis?.() || 0) - (a.dataCriacao?.toMillis?.() || 0));
}

export async function getCarros(): Promise<Carro[]> {
  try {
    const q = query(collection(db, CARROS_COLLECTION), where('status', '==', 'aprovado'));
    const snap = await getDocs(q);
    const todos = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Carro));
    return sortByDataCriacaoDesc(todos);
  } catch (err) {
    console.error('[DB] Erro ao buscar carros:', err);
    return [];
  }
}

export function subscribeCarros(
  onData: (carros: Carro[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(collection(db, CARROS_COLLECTION), where('status', '==', 'aprovado'));
  return onSnapshot(
    q,
    (snap) => {
      const todos = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Carro);
      onData(sortByDataCriacaoDesc(todos));
    },
    (err) => {
      console.error('[DB] Erro no snapshot de carros:', err);
      onError?.(err);
    },
  );
}

export async function getCarrosByCreator(email: string): Promise<Carro[]> {
  try {
    const q = query(collection(db, CARROS_COLLECTION), where('criador', '==', email));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Carro));
  } catch (err) {
    console.error('[DB] Erro ao buscar carros do criador:', err);
    return [];
  }
}

export async function getCarroPorId(id: string): Promise<Carro | null> {
  try {
    const docRef = doc(db, CARROS_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Carro;
    }
    return null;
  } catch (err) {
    console.error('[DB] Erro ao buscar carro:', err);
    return null;
  }
}

export async function addCarro(dados: Record<string, unknown>): Promise<Carro> {
  try {
    const docRef = await addDoc(collection(db, CARROS_COLLECTION), cleanUndefined({
      ...dados,
      status: 'pendente',
      dataCriacao: Timestamp.now(),
    }));
    return { id: docRef.id, ...cleanUndefined(dados), status: 'pendente' } as Carro;
  } catch (err) {
    console.error('[DB] Erro ao adicionar carro:', err);
    throw err;
  }
}

export async function deleteCarro(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, CARROS_COLLECTION, id));
  } catch (err) {
    console.error('[DB] Erro ao eliminar carro:', err);
    throw err;
  }
}

export async function getPecas(): Promise<Peca[]> {
  try {
    const q = query(collection(db, PECAS_COLLECTION), where('status', '==', 'aprovado'));
    const snap = await getDocs(q);
    const todas = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Peca));
    return sortByDataCriacaoDesc(todas);
  } catch (err) {
    console.error('[DB] Erro ao buscar peças:', err);
    return [];
  }
}

export function subscribePecas(
  onData: (pecas: Peca[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(collection(db, PECAS_COLLECTION), where('status', '==', 'aprovado'));
  return onSnapshot(
    q,
    (snap) => {
      const todas = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Peca);
      onData(sortByDataCriacaoDesc(todas));
    },
    (err) => {
      console.error('[DB] Erro no snapshot de peças:', err);
      onError?.(err);
    },
  );
}

export async function getPecasByCreator(email: string): Promise<Peca[]> {
  try {
    const q = query(collection(db, PECAS_COLLECTION), where('criador', '==', email));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Peca));
  } catch (err) {
    console.error('[DB] Erro ao buscar peças do criador:', err);
    return [];
  }
}

export async function getPecaPorId(id: string): Promise<Peca | null> {
  try {
    const docRef = doc(db, PECAS_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Peca;
    }
    return null;
  } catch (err) {
    console.error('[DB] Erro ao buscar peça:', err);
    return null;
  }
}

export async function addPeca(dados: Record<string, unknown>): Promise<Peca> {
  try {
    const docRef = await addDoc(collection(db, PECAS_COLLECTION), cleanUndefined({
      ...dados,
      status: 'pendente',
      dataCriacao: Timestamp.now(),
    }));
    return { id: docRef.id, ...cleanUndefined(dados), status: 'pendente' } as Peca;
  } catch (err) {
    console.error('[DB] Erro ao adicionar peça:', err);
    throw err;
  }
}

export async function deletePeca(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, PECAS_COLLECTION, id));
  } catch (err) {
    console.error('[DB] Erro ao eliminar peça:', err);
    throw err;
  }
}

// ============ USERS (PERFIS) ============

const USERS_COLLECTION = 'users';

export async function getUserProfile(uid: string): Promise<Usuario | null> {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return { uid: snap.id, ...snap.data() } as Usuario;
    }
    return null;
  } catch (err) {
    console.error('[DB] Erro ao buscar perfil:', err);
    return null;
  }
}

export async function createUserProfile(uid: string, data: Record<string, unknown>): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await setDoc(userRef, {
      ...data,
      dataCriacao: Timestamp.now(),
      dataAtualizacao: Timestamp.now(),
    }, { merge: true });
  } catch (err) {
    console.error('[DB] Erro ao criar perfil:', err);
    throw err;
  }
}

export async function updateUserProfile(uid: string, data: Record<string, unknown>): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await setDoc(userRef, { ...data, dataAtualizacao: Timestamp.now() }, { merge: true });
  } catch (err) {
    console.error('[DB] Erro ao atualizar perfil:', err);
    throw err;
  }
}

export async function getUserByEmail(email: string): Promise<Usuario | null> {
  try {
    const q = query(collection(db, USERS_COLLECTION), where('email', '==', email));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { uid: d.id, ...d.data() } as Usuario;
  } catch (err) {
    console.error('[DB] Erro ao buscar utilizador por email:', err);
    return null;
  }
}

// ============ ADMIN ============

export async function getAllUsers(): Promise<Usuario[]> {
  try {
    const snap = await getDocs(collection(db, USERS_COLLECTION));
    return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as Usuario));
  } catch (err) {
    console.error('[DB] Erro ao buscar utilizadores:', err);
    return [];
  }
}

export async function setUserRole(uid: string, role: Role): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await setDoc(userRef, { role, dataAtualizacao: Timestamp.now() }, { merge: true });
  } catch (err) {
    console.error('[DB] Erro ao alterar role:', err);
    throw err;
  }
}

export async function getAdminUsers(): Promise<Usuario[]> {
  try {
    const q = query(collection(db, USERS_COLLECTION), where('role', '==', 'admin'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as Usuario));
  } catch (err) {
    console.error('[DB] Erro ao buscar admins:', err);
    return [];
  }
}

export async function updateCarro(id: string, dados: Record<string, unknown>): Promise<void> {
  try {
    await updateDoc(doc(db, CARROS_COLLECTION, id), dados);
  } catch (err) {
    console.error('[DB] Erro ao atualizar carro:', err);
    throw err;
  }
}

export async function updatePeca(id: string, dados: Record<string, unknown>): Promise<void> {
  try {
    await updateDoc(doc(db, PECAS_COLLECTION, id), dados);
  } catch (err) {
    console.error('[DB] Erro ao atualizar peça:', err);
    throw err;
  }
}

export async function updateCarroStatus(id: string, status: StatusAnuncio): Promise<void> {
  try {
    const updates: Record<string, unknown> = { status };
    if (status === 'aprovado') {
      updates.dataAprovacao = Timestamp.now();
    }
    await updateDoc(doc(db, CARROS_COLLECTION, id), updates);
  } catch (err) {
    console.error('[DB] Erro ao atualizar status do carro:', err);
    throw err;
  }
}

export async function updatePecaStatus(id: string, status: StatusAnuncio): Promise<void> {
  try {
    const updates: Record<string, unknown> = { status };
    if (status === 'aprovado') {
      updates.dataAprovacao = Timestamp.now();
    }
    await updateDoc(doc(db, PECAS_COLLECTION, id), updates);
  } catch (err) {
    console.error('[DB] Erro ao atualizar status da peça:', err);
    throw err;
  }
}

export async function getAllCarrosAdmin(): Promise<Carro[]> {
  try {
    const q = query(collection(db, CARROS_COLLECTION), orderBy('dataCriacao', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Carro));
  } catch (err) {
    console.error('[DB] Erro ao buscar carros (admin):', err);
    return [];
  }
}

export async function getAllPecasAdmin(): Promise<Peca[]> {
  try {
    const q = query(collection(db, PECAS_COLLECTION), orderBy('dataCriacao', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Peca));
  } catch (err) {
    console.error('[DB] Erro ao buscar peças (admin):', err);
    return [];
  }
}

// ============ NOTIFICAÇÕES ============

const NOTIFICACOES_COLLECTION = 'notifications';

export async function criarNotificacao(
  uid: string,
  tipo: TipoNotificacao,
  titulo: string,
  mensagem: string,
  link?: string,
): Promise<void> {
  try {
    await addDoc(collection(db, NOTIFICACOES_COLLECTION), {
      uid,
      tipo,
      titulo,
      mensagem,
      link: link || null,
      lida: false,
      dataCriacao: Timestamp.now(),
    });
  } catch (err) {
    console.error('[DB] Erro ao criar notificação:', err);
  }
}

export async function getNotificacoes(uid: string): Promise<Notificacao[]> {
  try {
    const q = query(
      collection(db, NOTIFICACOES_COLLECTION),
      where('uid', '==', uid),
    );
    const snap = await getDocs(q);
    const notificacoes = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Notificacao));
    return sortByDataCriacaoDesc(notificacoes);
  } catch (err) {
    console.error('[DB] Erro ao buscar notificações:', err);
    return [];
  }
}

export function subscribeNotificacoes(
  uid: string,
  onData: (notificacoes: Notificacao[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(
    collection(db, NOTIFICACOES_COLLECTION),
    where('uid', '==', uid),
  );
  return onSnapshot(
    q,
    (snap) => {
      const notificacoes = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Notificacao));
      onData(sortByDataCriacaoDesc(notificacoes));
    },
    (err) => {
      console.error('[DB] Erro no snapshot de notificações:', err);
      onError?.(err);
    },
  );
}

export async function marcarNotificacaoLida(id: string): Promise<void> {
  try {
    await updateDoc(doc(db, NOTIFICACOES_COLLECTION, id), { lida: true });
  } catch (err) {
    console.error('[DB] Erro ao marcar notificação como lida:', err);
  }
}

export async function marcarTodasNotificacoesLidas(uid: string): Promise<void> {
  try {
    const q = query(
      collection(db, NOTIFICACOES_COLLECTION),
      where('uid', '==', uid),
      where('lida', '==', false),
    );
    const snap = await getDocs(q);
    if (snap.empty) return;
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.update(d.ref, { lida: true }));
    await batch.commit();
  } catch (err) {
    console.error('[DB] Erro ao marcar notificações como lidas:', err);
  }
}

export async function incrementCampo(colecao: string, id: string, campo: string): Promise<void> {
  try {
    await updateDoc(doc(db, colecao, id), { [campo]: increment(1) });
  } catch (err) {
    console.error(`[DB] Erro ao incrementar ${campo}:`, err);
  }
}

export async function decrementCampo(colecao: string, id: string, campo: string): Promise<void> {
  try {
    await updateDoc(doc(db, colecao, id), { [campo]: increment(-1) });
  } catch (err) {
    console.error(`[DB] Erro ao decrementar ${campo}:`, err);
  }
}

// ============ REVIEWS ============

const REVIEWS_COLLECTION = 'reviews';

export async function addReview(data: ReviewInput): Promise<Review> {
  try {
    if (data.comentario && contemProfanity(data.comentario)) {
      throw new Error('Comentário contém linguagem inapropriada.');
    }
    const docRef = await addDoc(collection(db, REVIEWS_COLLECTION), {
      ...data,
      status: 'pendente',
      dataCriacao: Timestamp.now(),
    });
    return { id: docRef.id, ...data, status: 'pendente' } as Review;
  } catch (err) {
    console.error('[DB] Erro ao adicionar avaliação:', err);
    throw err;
  }
}

export function subscribeReviews(
  vendedorEmail: string,
  onData: (reviews: Review[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(
    collection(db, REVIEWS_COLLECTION),
    where('vendedorEmail', '==', vendedorEmail),
    orderBy('dataCriacao', 'desc'),
  );
  return onSnapshot(
    q,
    (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Review);
      onData(all.filter((r) => r.status === 'aprovado'));
    },
    (err) => {
      console.error('[DB] Erro no snapshot de avaliações:', err);
      onError?.(err);
    },
  );
}

export function subscribeReviewsOficina(
  oficinaId: string,
  onData: (reviews: Review[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(
    collection(db, REVIEWS_COLLECTION),
    where('anuncioId', '==', oficinaId),
    where('anuncioTipo', '==', 'oficina'),
    orderBy('dataCriacao', 'desc'),
  );
  return onSnapshot(
    q,
    (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Review);
      onData(all.filter((r) => r.status === 'aprovado'));
    },
    (err) => {
      console.error('[DB] Erro no snapshot de avaliações de oficina:', err);
      onError?.(err);
    },
  );
}


export async function getReviewsByVendedor(vendedorEmail: string): Promise<Review[]> {
  try {
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      where('vendedorEmail', '==', vendedorEmail),
      orderBy('dataCriacao', 'desc'),
    );
    const snap = await getDocs(q);
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Review);
    return all.filter((r) => r.status === 'aprovado');
  } catch (err) {
    console.error('[DB] Erro ao buscar avaliações:', err);
    return [];
  }
}

export async function getAllReviewsAdmin(): Promise<Review[]> {
  try {
    const q = query(collection(db, REVIEWS_COLLECTION), orderBy('dataCriacao', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Review);
  } catch (err) {
    console.error('[DB] Erro ao buscar avaliações (admin):', err);
    return [];
  }
}

export async function updateReviewStatus(id: string, status: StatusReview): Promise<void> {
  try {
    await updateDoc(doc(db, REVIEWS_COLLECTION, id), { status });
  } catch (err) {
    console.error('[DB] Erro ao atualizar status da avaliação:', err);
    throw err;
  }
}

export async function deleteReview(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, REVIEWS_COLLECTION, id));
  } catch (err) {
    console.error('[DB] Erro ao eliminar avaliação:', err);
    throw err;
  }
}

export async function updateSellerRating(vendedorUid: string, vendedorEmail: string): Promise<void> {
  try {
    const reviews = await getReviewsByVendedor(vendedorEmail);
    const total = reviews.length;
    const media = total > 0 ? reviews.reduce((sum, r) => sum + r.nota, 0) / total : 0;

    const profile = await getUserProfile(vendedorUid);
    const existingBadges = (profile?.badges || []).filter((b) => b !== 'top_vendedor');
    if (total >= 5 && media >= 4.5) existingBadges.push('top_vendedor');

    await updateUserProfile(vendedorUid, {
      mediaAvaliacoes: Math.round(media * 10) / 10,
      totalAvaliacoes: total,
      badges: existingBadges,
    });
  } catch (err) {
    console.error('[DB] Erro ao atualizar rating do vendedor:', err);
  }
}

// ============ REPORTS ============

const REPORTS_COLLECTION = 'reports';

export async function addReport(data: ReportInput): Promise<Report> {
  try {
    const docRef = await addDoc(collection(db, REPORTS_COLLECTION), {
      ...data,
      dataCriacao: Timestamp.now(),
    });
    return { id: docRef.id, ...data } as Report;
  } catch (err) {
    console.error('[DB] Erro ao criar denúncia:', err);
    throw err;
  }
}

export async function getAllReports(): Promise<Report[]> {
  try {
    const q = query(collection(db, REPORTS_COLLECTION), orderBy('dataCriacao', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Report);
  } catch (err) {
    console.error('[DB] Erro ao buscar denúncias:', err);
    return [];
  }
}

export async function updateReportStatus(
  id: string,
  status: StatusReport,
  resolvidoPor: string,
  notasAdmin?: string,
): Promise<void> {
  try {
    const updates: Record<string, unknown> = { status, resolvidoPor };
    if (status === 'resolvido' || status === 'rejeitado') {
      updates.dataResolucao = Timestamp.now();
    }
    if (notasAdmin) updates.notasAdmin = notasAdmin;
    await updateDoc(doc(db, REPORTS_COLLECTION, id), updates);
  } catch (err) {
    console.error('[DB] Erro ao atualizar denúncia:', err);
    throw err;
  }
}

// ============ VERIFICATIONS ============

const VERIFICATIONS_COLLECTION = 'verifications';

export async function addVerification(data: VerificationInput): Promise<Verification> {
  try {
    const docRef = await addDoc(collection(db, VERIFICATIONS_COLLECTION), {
      ...data,
      dataPedido: Timestamp.now(),
    });
    return { id: docRef.id, ...data } as Verification;
  } catch (err) {
    console.error('[DB] Erro ao criar pedido de verificação:', err);
    throw err;
  }
}

export async function getVerificationByUid(uid: string): Promise<Verification | null> {
  try {
    const q = query(
      collection(db, VERIFICATIONS_COLLECTION),
      where('uid', '==', uid),
      orderBy('dataPedido', 'desc'),
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() } as Verification;
  } catch (err) {
    console.error('[DB] Erro ao buscar verificação:', err);
    return null;
  }
}

export async function getAllVerifications(): Promise<Verification[]> {
  try {
    const q = query(collection(db, VERIFICATIONS_COLLECTION), orderBy('dataPedido', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Verification);
  } catch (err) {
    console.error('[DB] Erro ao buscar verificações:', err);
    return [];
  }
}

export async function updateVerificationStatus(
  id: string,
  status: StatusVerificacao,
  resolvidoPor: string,
  notasAdmin?: string,
): Promise<void> {
  try {
    const updates: Record<string, unknown> = { status, resolvidoPor };
    if (status === 'aprovado' || status === 'rejeitado') {
      updates.dataResolucao = Timestamp.now();
    }
    if (notasAdmin) updates.notasAdmin = notasAdmin;
    await updateDoc(doc(db, VERIFICATIONS_COLLECTION, id), updates);
  } catch (err) {
    console.error('[DB] Erro ao atualizar verificação:', err);
    throw err;
  }
}

export async function deleteVerificationFiles(documentoUrl: string, selfieUrl: string): Promise<void> {
  const deleteByUrl = async (url: string) => {
    try {
      const storageRef = ref(storage, url);
      await deleteObject(storageRef);
    } catch (err) {
      console.error('[DB] Erro ao apagar ficheiro de verificação:', err);
    }
  };
  await Promise.all([deleteByUrl(documentoUrl), deleteByUrl(selfieUrl)]);
}

export async function clearVerificationUrls(id: string): Promise<void> {
  try {
    await updateDoc(doc(db, VERIFICATIONS_COLLECTION, id), {
      documentoUrl: '',
      selfieUrl: '',
    });
  } catch (err) {
    console.error('[DB] Erro ao limpar URLs de verificação:', err);
  }
}

// ============ INTENCOES DE COMPRA ============

function cleanUndefined(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    if (value !== null && typeof value === 'object' && !(value instanceof Timestamp)) {
      result[key] = Array.isArray(value)
        ? value
            .filter((item: any) => item !== undefined)
            .map((item: any) =>
                item !== null && typeof item === 'object' && !(item instanceof Timestamp)
                  ? cleanUndefined(item)
                  : item,
              )
        : cleanUndefined(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

const INTENCOES_COLLECTION = 'intencoes_compra';
const CONTATOS_INTENCAO_COLLECTION = 'contatos_intencao';
const DENUNCIAS_INTENCAO_COLLECTION = 'denuncias_intencao';

export async function criarIntencaoCompra(dados: IntencaoCompraInput): Promise<string> {
  try {
    const intencaoId = doc(collection(db, INTENCOES_COLLECTION)).id;
    await setDoc(doc(db, INTENCOES_COLLECTION, intencaoId), cleanUndefined({
      id: intencaoId,
      ...dados,
      status: 'pendente',
      prioritaria: false,
      stats: {
        visualizacoes: 0,
        visualizacoes7Dias: 0,
        contatos: 0,
        contatos7Dias: 0,
      },
      criadaEm: Timestamp.now(),
      atualizadaEm: Timestamp.now(),
    }));
    return intencaoId;
  } catch (err) {
    console.error('[DB] Erro ao criar intenção de compra:', err);
    throw err;
  }
}

export async function getIntencaoCompra(id: string): Promise<IntencaoCompra | null> {
  try {
    const docRef = doc(db, INTENCOES_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    updateDoc(docRef, {
      'stats.visualizacoes': increment(1),
      'stats.visualizacoes7Dias': increment(1),
    }).catch(() => {});
    return { id: snap.id, ...snap.data() } as IntencaoCompra;
  } catch (err) {
    console.error('[DB] Erro ao buscar intenção:', err);
    return null;
  }
}

export async function getIntencoesPorUsuario(userId: string): Promise<IntencaoCompra[]> {
  try {
    const q = query(
      collection(db, INTENCOES_COLLECTION),
      where('userId', '==', userId),
    );
    const snap = await getDocs(q);
    const results = snap.docs.map((d) => ({ id: d.id, ...d.data() } as IntencaoCompra));
    results.sort((a, b) => {
      const aTime = a.atualizadaEm?.toDate?.()?.getTime() || 0;
      const bTime = b.atualizadaEm?.toDate?.()?.getTime() || 0;
      return bTime - aTime;
    });
    return results;
  } catch (err) {
    console.error('[DB] Erro ao buscar intenções do utilizador:', err);
    return [];
  }
}

export async function atualizarIntencaoCompra(id: string, userId: string, updates: Record<string, unknown>): Promise<void> {
  try {
    const docRef = doc(db, INTENCOES_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Intenção não encontrada');
    const data = snap.data() as IntencaoCompra;
    if (data.userId !== userId) throw new Error('Não autorizado');
    await updateDoc(docRef, { ...updates, atualizadaEm: Timestamp.now() });
  } catch (err) {
    console.error('[DB] Erro ao atualizar intenção:', err);
    throw err;
  }
}

export async function deletarIntencaoCompra(id: string, userId: string): Promise<void> {
  try {
    const docRef = doc(db, INTENCOES_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Intenção não encontrada');
    const data = snap.data() as IntencaoCompra;
    if (data.userId !== userId) throw new Error('Não autorizado');
    await updateDoc(docRef, {
      status: 'deletada',
      deletadaEm: Timestamp.now(),
      atualizadaEm: Timestamp.now(),
    });
  } catch (err) {
    console.error('[DB] Erro ao deletar intenção:', err);
    throw err;
  }
}

export async function pausarIntencaoCompra(id: string, userId: string): Promise<void> {
  try {
    const docRef = doc(db, INTENCOES_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Intenção não encontrada');
    const data = snap.data() as IntencaoCompra;
    if (data.userId !== userId) throw new Error('Não autorizado');
    await updateDoc(docRef, {
      status: 'pausada',
      expiradoEm: Timestamp.now(),
      atualizadaEm: Timestamp.now(),
    });
  } catch (err) {
    console.error('[DB] Erro ao pausar intenção:', err);
    throw err;
  }
}

export async function reativarIntencaoCompra(id: string, userId: string): Promise<void> {
  try {
    const docRef = doc(db, INTENCOES_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Intenção não encontrada');
    const data = snap.data() as IntencaoCompra;
    if (data.userId !== userId) throw new Error('Não autorizado');
    await updateDoc(docRef, {
      status: 'ativa',
      expiradoEm: null,
      atualizadaEm: Timestamp.now(),
    });
  } catch (err) {
    console.error('[DB] Erro ao reativar intenção:', err);
    throw err;
  }
}

export async function buscarIntencoesMatch(carro: Record<string, any>, usuarioId: string): Promise<IntencaoCompra[]> {
  try {
    const filters: any[] = [where('status', '==', 'ativa')];

    if (carro.categoria && carro.categoria !== 'todos') {
      filters.push(where('categoria', '==', carro.categoria));
    }

    const q = query(
      collection(db, INTENCOES_COLLECTION),
      ...filters,
    );
    const snap = await getDocs(q);
    let resultados = snap.docs.map((d) => ({ id: d.id, ...d.data() } as IntencaoCompra));

    resultados = resultados.filter((intencao) => {
      if (intencao.userId === usuarioId) return false;
      const c = intencao.criterios;
      const cat = intencao.categoria;

      if (cat === 'pecas') return true;

      if (carro.marca && c.marca && c.marca !== carro.marca) return false;
      if (c.anoMinimo && carro.anoFabricacao && carro.anoFabricacao < c.anoMinimo) return false;
      if (c.anoMaximo && carro.anoFabricacao && carro.anoFabricacao > c.anoMaximo) return false;
      if (c.precoMinimo && carro.preco && carro.preco < c.precoMinimo) return false;
      if (carro.preco && carro.preco > c.precoMaximo) return false;
      if (c.combustivel && !c.combustivel.includes('qualquer') && !c.combustivel.includes(carro.combustivel?.toLowerCase())) return false;
      if (c.tipoTransmissao && !c.tipoTransmissao.includes('qualquer') && !c.tipoTransmissao.includes(carro.cambio?.toLowerCase())) return false;
      if (c.quilometragemMaxima && carro.km && carro.km > c.quilometragemMaxima) return false;
      if (c.localizacao?.distrito && c.localizacao.distrito !== 'todo_portugal' && carro.local && carro.local !== c.localizacao.distrito) return false;

      return true;
    });

    return resultados;
  } catch (err) {
    console.error('[DB] Erro ao buscar intenções match:', err);
    return [];
  }
}

export async function iniciarContatoIntencao(
  intencaoId: string,
  vendedorId: string,
  carroId?: string,
  mensagem?: string,
): Promise<string> {
  try {
    const contatoId = doc(collection(db, CONTATOS_INTENCAO_COLLECTION)).id;
    const chatId = doc(collection(db, 'messages')).id;

    await setDoc(doc(db, CONTATOS_INTENCAO_COLLECTION, contatoId), {
      id: contatoId,
      intencaoId,
      vendedorId,
      carroId: carroId || null,
      titulo: carroId ? 'Tenho um carro para você!' : 'Interesse em sua intenção',
      descricao: mensagem || null,
      precoOferido: null,
      status: 'aberto',
      chatId,
      marcadoComoRelevante: false,
      criadoEm: Timestamp.now(),
      atualizadoEm: Timestamp.now(),
    });

    if (mensagem) {
      await setDoc(doc(db, 'messages', chatId), {
        listingId: intencaoId,
        listingType: 'intencao',
        listingTitle: '',
        fromUid: vendedorId,
        fromNome: '',
        toUid: '',
        toNome: '',
        participants: [vendedorId],
        mensagem,
        lida: false,
        dataCriacao: Timestamp.now(),
      });
    }

    // Counter bump must not fail the contact that was already created.
    await updateDoc(doc(db, INTENCOES_COLLECTION, intencaoId), {
      'stats.contatos': increment(1),
      'stats.contatos7Dias': increment(1),
    }).catch((err) => {
      console.warn('[DB] Falha ao incrementar stats da intenção:', err);
    });

    return contatoId;
  } catch (err) {
    console.error('[DB] Erro ao iniciar contato:', err);
    throw err;
  }
}

export async function getContatosPorIntencao(intencaoId: string): Promise<ContatoIntencao[]> {
  try {
    const q = query(
      collection(db, CONTATOS_INTENCAO_COLLECTION),
      where('intencaoId', '==', intencaoId),
    );
    const snap = await getDocs(q);
    const results = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ContatoIntencao));
    results.sort((a, b) => {
      const aTime = a.criadoEm?.toDate?.()?.getTime() || 0;
      const bTime = b.criadoEm?.toDate?.()?.getTime() || 0;
      return bTime - aTime;
    });
    return results;
  } catch (err) {
    console.error('[DB] Erro ao buscar contatos:', err);
    return [];
  }
}

export async function marcarContatoRelevante(contatoId: string, userId: string): Promise<void> {
  try {
    const docRef = doc(db, CONTATOS_INTENCAO_COLLECTION, contatoId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Contato não encontrado');
    await updateDoc(docRef, {
      marcadoComoRelevante: true,
      atualizadoEm: Timestamp.now(),
    });
  } catch (err) {
    console.error('[DB] Erro ao marcar contato relevante:', err);
    throw err;
  }
}

export async function rejeitarContato(contatoId: string, userId: string): Promise<void> {
  try {
    const docRef = doc(db, CONTATOS_INTENCAO_COLLECTION, contatoId);
    await updateDoc(docRef, {
      status: 'rejeitado',
      atualizadoEm: Timestamp.now(),
    });
  } catch (err) {
    console.error('[DB] Erro ao rejeitar contato:', err);
    throw err;
  }
}

// ============ DENUNCIAS INTENCAO ============

export async function addDenunciaIntencao(data: {
  intencaoId: string;
  denunciantId: string;
  motivo: string;
  descricao: string;
}): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, DENUNCIAS_INTENCAO_COLLECTION), {
      ...data,
      status: 'aberta',
      criadaEm: Timestamp.now(),
    });
    return docRef.id;
  } catch (err) {
    console.error('[DB] Erro ao criar denúncia de intenção:', err);
    throw err;
  }
}

export async function getDenunciasIntencao(): Promise<DenunciaIntencao[]> {
  try {
    const q = query(collection(db, DENUNCIAS_INTENCAO_COLLECTION), orderBy('criadaEm', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as DenunciaIntencao));
  } catch (err) {
    console.error('[DB] Erro ao buscar denúncias:', err);
    return [];
  }
}

export async function updateDenunciaIntencaoStatus(
  id: string,
  status: string,
  investigadorId: string,
  acaoTomada?: string,
  notas?: string,
): Promise<void> {
  try {
    const updates: Record<string, unknown> = { status, investigadorId };
    if (status === 'resolvida') {
      updates.resolvidaEm = Timestamp.now();
    }
    if (acaoTomada) updates.acaoTomada = acaoTomada;
    if (notas) updates.notas = notas;
    await updateDoc(doc(db, DENUNCIAS_INTENCAO_COLLECTION, id), updates);
  } catch (err) {
    console.error('[DB] Erro ao atualizar denúncia:', err);
    throw err;
  }
}

export async function getAllIntencoesAdmin(): Promise<IntencaoCompra[]> {
  try {
    const snap = await getDocs(collection(db, INTENCOES_COLLECTION));
    const results = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as IntencaoCompra))
      .filter((i) => i.status !== 'deletada');
    results.sort((a, b) => {
      const aTime = a.atualizadaEm?.toDate?.()?.getTime() || 0;
      const bTime = b.atualizadaEm?.toDate?.()?.getTime() || 0;
      return bTime - aTime;
    });
    return results;
  } catch (err) {
    console.error('[DB] Erro ao buscar intenções (admin):', err);
    return [];
  }
}

export async function getIntencoesAtivas(): Promise<IntencaoCompra[]> {
  try {
    const q = query(
      collection(db, INTENCOES_COLLECTION),
      where('status', '==', 'ativa'),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as IntencaoCompra));
  } catch (err) {
    console.error('[DB] Erro ao buscar intenções ativas:', err);
    return [];
  }
}

export async function updateIntencaoStatus(id: string, status: string): Promise<void> {
  try {
    await updateDoc(doc(db, INTENCOES_COLLECTION, id), { status, atualizadaEm: Timestamp.now() });
  } catch (err) {
    console.error('[DB] Erro ao atualizar status da intenção:', err);
    throw err;
  }
}

// ============ OFICINAS E MECÂNICOS ============
import type { OficinaMecanico } from '@/types/oficina';

export async function getOficinas(): Promise<OficinaMecanico[]> {
  try {
    const q = query(collection(db, OFICINAS_COLLECTION), where('status', '==', 'aprovado'));
    const snap = await getDocs(q);
    const todas = snap.docs.map((d) => ({ id: d.id, ...d.data() } as OficinaMecanico));
    return sortByDataCriacaoDesc(todas);
  } catch (err) {
    console.error('[DB] Erro ao buscar oficinas:', err);
    return [];
  }
}

export function subscribeOficinas(
  onData: (oficinas: OficinaMecanico[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(collection(db, OFICINAS_COLLECTION), where('status', '==', 'aprovado'));
  return onSnapshot(
    q,
    (snap) => {
      const todas = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as OficinaMecanico);
      onData(sortByDataCriacaoDesc(todas));
    },
    (err) => {
      console.error('[DB] Erro no snapshot de oficinas:', err);
      onError?.(err);
    },
  );
}

export async function getOficinaPorId(id: string): Promise<OficinaMecanico | null> {
  try {
    const docRef = doc(db, OFICINAS_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as OficinaMecanico;
    }
    return null;
  } catch (err) {
    console.error('[DB] Erro ao buscar oficina:', err);
    return null;
  }
}

export async function addOficina(dados: Record<string, unknown>): Promise<OficinaMecanico> {
  try {
    const docRef = await addDoc(collection(db, OFICINAS_COLLECTION), {
      ...dados,
      status: 'pendente',
      dataCriacao: Timestamp.now(),
    });
    return { id: docRef.id, ...dados, status: 'pendente' } as OficinaMecanico;
  } catch (err) {
    console.error('[DB] Erro ao adicionar oficina:', err);
    throw err;
  }
}

export async function updateOficina(id: string, dados: Record<string, unknown>): Promise<void> {
  try {
    await updateDoc(doc(db, OFICINAS_COLLECTION, id), dados);
  } catch (err) {
    console.error('[DB] Erro ao atualizar oficina:', err);
    throw err;
  }
}

export async function updateOficinaStatus(id: string, status: 'pendente' | 'aprovado' | 'rejeitado'): Promise<void> {
  try {
    await updateDoc(doc(db, OFICINAS_COLLECTION, id), { status });
  } catch (err) {
    console.error('[DB] Erro ao atualizar status da oficina:', err);
    throw err;
  }
}

export async function getOficinasByCreator(email: string): Promise<OficinaMecanico[]> {
  try {
    const q = query(collection(db, OFICINAS_COLLECTION), where('criador', '==', email));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as OficinaMecanico));
  } catch (err) {
    console.error('[DB] Erro ao buscar oficinas do criador:', err);
    return [];
  }
}

export async function deleteOficina(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, OFICINAS_COLLECTION, id));
  } catch (err) {
    console.error('[DB] Erro ao eliminar oficina:', err);
    throw err;
  }
}

export async function getAllOficinasAdmin(): Promise<OficinaMecanico[]> {
  try {
    const q = query(collection(db, OFICINAS_COLLECTION), orderBy('dataCriacao', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as OficinaMecanico));
  } catch (err) {
    console.error('[DB] Erro ao buscar oficinas (admin):', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Propostas / Contra-propostas (seller → interested buyer negotiation)
// ---------------------------------------------------------------------------

const PROPOSTAS_COLLECTION = 'propostas';

function ordenarPorCriacao<T extends { criadaEm?: { toDate?: () => Date } }>(items: T[]): T[] {
  return items.sort(
    (a, b) => (b.criadaEm?.toDate?.()?.getTime() || 0) - (a.criadaEm?.toDate?.()?.getTime() || 0),
  );
}

export async function criarProposta(dados: PropostaInput): Promise<Proposta> {
  try {
    const id = doc(collection(db, PROPOSTAS_COLLECTION)).id;
    const agora = Timestamp.now();
    const proposta: Proposta = { id, ...dados, criadaEm: agora, atualizadaEm: agora };
    await setDoc(doc(db, PROPOSTAS_COLLECTION, id), cleanUndefined({ ...proposta }));
    return proposta;
  } catch (err) {
    console.error('[DB] Erro ao criar proposta:', err);
    throw err;
  }
}

export async function getPropostasPorVendedor(vendedorUid: string): Promise<Proposta[]> {
  try {
    const q = query(collection(db, PROPOSTAS_COLLECTION), where('vendedorUid', '==', vendedorUid));
    const snap = await getDocs(q);
    return ordenarPorCriacao(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Proposta)));
  } catch (err) {
    console.error('[DB] Erro ao buscar propostas (vendedor):', err);
    return [];
  }
}

export async function getPropostasPorComprador(compradorUid: string): Promise<Proposta[]> {
  try {
    const q = query(collection(db, PROPOSTAS_COLLECTION), where('compradorUid', '==', compradorUid));
    const snap = await getDocs(q);
    return ordenarPorCriacao(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Proposta)));
  } catch (err) {
    console.error('[DB] Erro ao buscar propostas (comprador):', err);
    return [];
  }
}

export async function atualizarProposta(id: string, status: StatusProposta): Promise<void> {
  try {
    const updates: Record<string, unknown> = { status, atualizadaEm: Timestamp.now() };
    if (status === 'aceita' || status === 'rejeitada') {
      updates.respostaCompradorEm = Timestamp.now();
    }
    await updateDoc(doc(db, PROPOSTAS_COLLECTION, id) as any, updates as any);
  } catch (err) {
    console.error('[DB] Erro ao atualizar proposta:', err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Leads de parceria (financing / insurance simulators) — consent-gated (RGPD)
// ---------------------------------------------------------------------------

const LEADS_PARCERIA_COLLECTION = 'leads_parceria';

export async function criarLeadParceria(dados: LeadParceriaInput): Promise<string> {
  try {
    const id = doc(collection(db, LEADS_PARCERIA_COLLECTION)).id;
    await setDoc(
      doc(db, LEADS_PARCERIA_COLLECTION, id),
      cleanUndefined({ id, ...dados, criadaEm: Timestamp.now() }),
    );
    return id;
  } catch (err) {
    console.error('[DB] Erro ao criar lead de parceria:', err);
    throw err;
  }
}

