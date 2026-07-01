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
import { DB_VERSION, DB_VERSION_KEY } from './constants';
import { docCountry, getActiveCountry } from '@/lib/country';
import { contemProfanity } from './profanity';
import type { Carro, CarroInput, StatusAnuncio } from '@/types/carro';
import type { Peca, PecaInput, CompatibilityEntry } from '@/types/peca';
import type { Usuario, Role, PremiumConfig } from '@/types/usuario';
import type { Notificacao, TipoNotificacao } from '@/types/notificacao';
import type { Review, ReviewInput, StatusReview } from '@/types/review';
import type { Report, ReportInput, StatusReport } from '@/types/report';
import type { Verification, VerificationInput, StatusVerificacao } from '@/types/verification';
import type { IntencaoCompra, IntencaoCompraInput, ContatoIntencao, ContatoIntencaoInput, DenunciaIntencao } from '@/types/intencao';
import type { Proposta, PropostaInput, StatusProposta } from '@/types/proposal';
import type { LeadParceria, LeadParceriaInput } from '@/types/lead';
import type { OficinaMecanico } from '@/types/oficina';
import type { Banner, BannerInput } from '@/types/banner';

const CARROS_COLLECTION = 'cars';
const PECAS_COLLECTION = 'parts';
const OFICINAS_COLLECTION = 'services';
const BANNERS_COLLECTION = 'banners';

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
      country: getActiveCountry(),
      ...dados,
      status: 'pendente',
      dataCriacao: Timestamp.now(),
    }));
    return { id: docRef.id, country: getActiveCountry(), ...cleanUndefined(dados), status: 'pendente' } as Carro;
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
      country: getActiveCountry(),
      ...dados,
      status: 'pendente',
      dataCriacao: Timestamp.now(),
    }));
    return { id: docRef.id, country: getActiveCountry(), ...cleanUndefined(dados), status: 'pendente' } as Peca;
  } catch (err) {
    console.error('[DB] Erro ao adicionar peça:', err);
    throw err;
  }
}

export async function addPecasBatch(dadosList: Record<string, unknown>[]): Promise<string[]> {
  if (dadosList.length === 0) return [];
  try {
    const batch = writeBatch(db);
    const ids: string[] = [];
    const now = Timestamp.now();
    for (const dados of dadosList) {
      const ref = doc(collection(db, PECAS_COLLECTION));
      batch.set(ref, { country: getActiveCountry(), ...dados, status: 'pendente', dataCriacao: now });
      ids.push(ref.id);
    }
    await batch.commit();
    return ids;
  } catch (err) {
    console.error('[DB] Erro ao adicionar peças em lote:', err);
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
      country: getActiveCountry(),
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

// ---------------------------------------------------------------------------
// Planos Premium (admin-managed)
// ---------------------------------------------------------------------------

export type PlanInfo = {
  planoId: string;
  nome: string;
  categoria: 'anuncios' | 'oficinas' | 'leads';
};

export async function setUserPlan(
  uid: string,
  plan: PlanInfo,
  adminUid: string,
  adminNome: string,
  dias: number,
): Promise<void> {
  try {
    const agora = Timestamp.now();
    const expMs = agora.toMillis() + dias * 86400000;
    const dataExpiracao = Timestamp.fromMillis(expMs);
    const userRef = doc(db, USERS_COLLECTION, uid);
    await setDoc(
      userRef,
      {
        planoAtivo: {
          planoId: plan.planoId,
          nome: plan.nome,
          categoria: plan.categoria,
          dataAtribuicao: agora,
          dataExpiracao,
          atribuidoPor: 'admin' as const,
          adminUid,
          adminNome,
        },
        dataAtualizacao: Timestamp.now(),
      },
      { merge: true },
    );
  } catch (err) {
    console.error('[DB] Erro ao atribuir plano:', err);
    throw err;
  }
}

export async function revokeUserPlan(uid: string): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userRef, {
      planoAtivo: null,
      dataAtualizacao: Timestamp.now(),
    });
  } catch (err) {
    console.error('[DB] Erro ao revogar plano:', err);
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

export async function matchAndNotifyForPeca(peca: Peca): Promise<number> {
  try {
    if (peca.tipo === 'procura') return 0;
    const { pecasShareCompatibility } = await import('./compatibility');
    const constraints = [
      where('status', '==', 'aprovado'),
      where('tipo', '==', 'procura'),
    ];
    if (peca.categoria) {
      constraints.push(where('categoria', '==', peca.categoria));
    }
    const qProcuras = query(collection(db, PECAS_COLLECTION), ...constraints);
    const snap = await getDocs(qProcuras);
    const procuras = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Peca));
    const matches = procuras.filter(
      (p) => p.criadorUid && p.criadorUid !== peca.criadorUid && pecasShareCompatibility(peca, p),
    );
    const seen = new Set<string>();
    let notified = 0;
    for (const procura of matches) {
      if (!procura.criadorUid || seen.has(procura.criadorUid)) continue;
      seen.add(procura.criadorUid);
      await criarNotificacao(
        procura.criadorUid,
        'info',
        'Peça encontrada para o seu pedido!',
        `"${peca.titulo}" corresponde ao seu pedido "${procura.titulo}".`,
        `/pecas?peca=${peca.id}`,
      );
      notified++;
    }
    return notified;
  } catch (err) {
    console.error('[DB] Erro em matchAndNotifyForPeca:', err);
    return 0;
  }
}

export async function countProcurasForPeca(peca: Peca): Promise<number> {
  try {
    const { pecasShareCompatibility } = await import('./compatibility');
    const constraints = [
      where('status', '==', 'aprovado'),
      where('tipo', '==', 'procura'),
    ];
    if (peca.categoria) {
      constraints.push(where('categoria', '==', peca.categoria));
    }
    const qProcuras = query(collection(db, PECAS_COLLECTION), ...constraints);
    const snap = await getDocs(qProcuras);
    const procuras = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Peca));
    return procuras.filter(
      (p) => p.criadorUid !== peca.criadorUid && pecasShareCompatibility(peca, p),
    ).length;
  } catch (err) {
    console.error('[DB] Erro em countProcurasForPeca:', err);
    return 0;
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
      country: getActiveCountry(),
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
      // Market isolation (plan 20): an intent only matches cars from its own market.
      if (docCountry(intencao) !== docCountry(carro)) return false;
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
      country: getActiveCountry(),
      ...dados,
      status: 'pendente',
      dataCriacao: Timestamp.now(),
    });
    return { id: docRef.id, country: getActiveCountry(), ...dados, status: 'pendente' } as OficinaMecanico;
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
    const proposta: Proposta = { id, country: getActiveCountry(), ...dados, criadaEm: agora, atualizadaEm: agora };
    await setDoc(doc(db, PROPOSTAS_COLLECTION, id), cleanUndefined({ ...proposta }));

    // Criar notificação para o vendedor
    await criarNotificacao(
      dados.vendedorUid,
      'info',
      'Nova Proposta Recebida 💰',
      `${dados.compradorNome} enviou uma proposta de ${dados.valor}€ para o seu anúncio: ${dados.anuncioTitulo}`,
      '/perfil',
    );

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
    const docRef = doc(db, PROPOSTAS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const prop = docSnap.data() as Proposta;
      const updates: Record<string, unknown> = { status, atualizadaEm: Timestamp.now() };
      if (status === 'aceita' || status === 'rejeitada') {
        updates.respostaCompradorEm = Timestamp.now();
      }
      await updateDoc(docRef as any, updates as any);

      // Notificar o comprador sobre a resposta
      const statusStr = status === 'aceita' ? 'aceitou' : status === 'rejeitada' ? 'rejeitou' : status;
      await criarNotificacao(
        prop.compradorUid,
        'info',
        `Proposta de Compra ${status === 'aceita' ? 'Aceite' : 'Rejeitada'} 💰`,
        `O vendedor ${statusStr} a sua proposta de ${prop.valor}€ no anúncio: ${prop.anuncioTitulo}`,
        '/perfil',
      );
    }
  } catch (err) {
    console.error('[DB] Erro ao atualizar proposta:', err);
    throw err;
  }
}

export async function eliminarDadosDoUtilizador(uid: string): Promise<void> {
  try {
    // 1. Eliminar anúncios de carros
    const qCars = query(collection(db, CARROS_COLLECTION), where('criadorUid', '==', uid));
    const snapCars = await getDocs(qCars);
    for (const docSnap of snapCars.docs) {
      await deleteDoc(docSnap.ref);
    }

    // 2. Eliminar anúncios de peças
    const qParts = query(collection(db, PECAS_COLLECTION), where('criadorUid', '==', uid));
    const snapParts = await getDocs(qParts);
    for (const docSnap of snapParts.docs) {
      await deleteDoc(docSnap.ref);
    }

    // 3. Eliminar propostas (onde o utilizador é comprador OU vendedor)
    const qPropComp = query(collection(db, PROPOSTAS_COLLECTION), where('compradorUid', '==', uid));
    const snapPropComp = await getDocs(qPropComp);
    for (const docSnap of snapPropComp.docs) {
      await deleteDoc(docSnap.ref);
    }
    const qPropVend = query(collection(db, PROPOSTAS_COLLECTION), where('vendedorUid', '==', uid));
    const snapPropVend = await getDocs(qPropVend);
    for (const docSnap of snapPropVend.docs) {
      await deleteDoc(docSnap.ref);
    }

    // 4. Eliminar notificações do utilizador
    const qNotif = query(collection(db, NOTIFICACOES_COLLECTION), where('uid', '==', uid));
    const snapNotif = await getDocs(qNotif);
    for (const docSnap of snapNotif.docs) {
      await deleteDoc(docSnap.ref);
    }

    // 5. Eliminar intenções de compra do utilizador
    const qInten = query(collection(db, INTENCOES_COLLECTION), where('uid', '==', uid));
    const snapInten = await getDocs(qInten);
    for (const docSnap of snapInten.docs) {
      await deleteDoc(docSnap.ref);
    }

    // 6. Eliminar verificação de identidade
    const qVerif = query(collection(db, VERIFICATIONS_COLLECTION), where('uid', '==', uid));
    const snapVerif = await getDocs(qVerif);
    for (const docSnap of snapVerif.docs) {
      await deleteDoc(docSnap.ref);
    }

    // 7. Eliminar reviews escritas pelo utilizador
    const qRev = query(collection(db, REVIEWS_COLLECTION), where('autorUid', '==', uid));
    const snapRev = await getDocs(qRev);
    for (const docSnap of snapRev.docs) {
      await deleteDoc(docSnap.ref);
    }

    // 8. Eliminar mensagens de chats do utilizador
    const qMessages = query(collection(db, 'messages'), where('participants', 'array-contains', uid));
    const snapMessages = await getDocs(qMessages);
    for (const docSnap of snapMessages.docs) {
      await deleteDoc(docSnap.ref);
    }

    // 9. Eliminar perfil do utilizador
    await deleteDoc(doc(db, USERS_COLLECTION, uid));
  } catch (err) {
    console.error('[DB] Erro ao eliminar dados do utilizador:', err);
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

export async function getLeadsParceriaAdmin(): Promise<LeadParceria[]> {
  try {
    const q = query(collection(db, LEADS_PARCERIA_COLLECTION), orderBy('criadaEm', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as LeadParceria);
  } catch (err) {
    console.error('[DB] Erro ao buscar leads de parceria:', err);
    return [];
  }
}

// ============ CONFIG (PREMIUM CONTROLS) ============

const CONFIG_COLLECTION = 'config';
const PREMIUM_DOC = 'premium';

export async function getPremiumConfig(): Promise<PremiumConfig> {
  try {
    const docRef = doc(db, CONFIG_COLLECTION, PREMIUM_DOC);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        masterActive: data.masterActive !== false,
        impulsionamento: data.impulsionamento !== false,
        oficinas: data.oficinas !== false,
        leads: data.leads !== false,
        parceriasActive: data.parceriasActive !== false,
        financiamento: data.financiamento !== false,
        seguro: data.seguro !== false,
        atualizadoEm: data.atualizadoEm,
        atualizadoPor: data.atualizadoPor,
      } as PremiumConfig;
    }
    return {
      masterActive: true,
      impulsionamento: true,
      oficinas: true,
      leads: true,
      parceriasActive: true,
      financiamento: true,
      seguro: true,
    };
  } catch (err) {
    console.error('[DB] Erro ao buscar premium config:', err);
    return {
      masterActive: true,
      impulsionamento: true,
      oficinas: true,
      leads: true,
      parceriasActive: true,
      financiamento: true,
      seguro: true,
    };
  }
}

export async function updatePremiumConfig(
  features: Partial<PremiumConfig>,
  adminUid: string,
): Promise<void> {
  try {
    const docRef = doc(db, CONFIG_COLLECTION, PREMIUM_DOC);
    await setDoc(
      docRef,
      {
        ...features,
        atualizadoEm: Timestamp.now(),
        atualizadoPor: adminUid,
      },
      { merge: true },
    );
  } catch (err) {
    console.error('[DB] Erro ao atualizar premium config:', err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Admin Dashboard Stats (real data aggregation)
// ---------------------------------------------------------------------------

export interface DashboardMonthlyStats {
  mes: string; // "Jan", "Fev", etc.
  utilizadores: number;
  carros: number;
  pecas: number;
  oficinas: number;
  intencoes: number;
}

export interface AdminDashboardStats {
  /** Contagem de utilizadores por faixa de antiguidade (dias desde dataCriacao) */
  antiguidade: { range: string; percent: number; count: number }[];
  /** Métricas mensais para gráfico de evolução (últimos 6 meses) */
  evolucaoMensal: DashboardMonthlyStats[];
  /** Total de utilizadores que criaram pelo menos 1 anúncio */
  utilizadoresAtivos: number;
  /** Média de anúncios por utilizador */
  mediaAnunciosPorUtilizador: number;
  /** Total de visualizações acumuladas */
  totalVisualizacoes: number;
  /** Total de contagens de mensagens */
  totalMensagens: number;
}

function getMonthLabel(monthIndex: number): string {
  const labels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return labels[monthIndex] || '?';
}

function getLast6Months(): { year: number; month: number; label: string }[] {
  const now = new Date();
  const months: { year: number; month: number; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth(), label: getMonthLabel(d.getMonth()) });
  }
  return months;
}

function isInMonth(timestamp: Timestamp | undefined, year: number, month: number): boolean {
  if (!timestamp) return false;
  const d = timestamp.toDate();
  return d.getFullYear() === year && d.getMonth() === month;
}

export async function getAdminDashboardStats(
  users: Usuario[],
  carros: Carro[],
  pecas: Peca[],
  oficinas: OficinaMecanico[],
  intencoes: IntencaoCompra[],
): Promise<AdminDashboardStats> {
  // --- Antiguidade dos utilizadores (proxy para faixas etárias / tempo de plataforma) ---
  const now = Date.now();
  const antiguidadeRanges = [
    { label: '0 - 30 dias', min: 0, max: 30 },
    { label: '1 - 3 meses', min: 31, max: 90 },
    { label: '3 - 6 meses', min: 91, max: 180 },
    { label: '6 - 12 meses', min: 181, max: 365 },
    { label: '+ 1 ano', min: 366, max: Infinity },
  ];

  const antiguidade = antiguidadeRanges.map((range) => {
    const count = users.filter((u) => {
      const dataCriacao = u.dataCriacao?.toDate?.()?.getTime();
      if (!dataCriacao) return false;
      const dias = Math.floor((now - dataCriacao) / 86400000);
      return dias >= range.min && dias <= range.max;
    }).length;
    return {
      range: range.label,
      percent: users.length > 0 ? Math.round((count / users.length) * 100) : 0,
      count,
    };
  });

  // --- Evolução mensal (últimos 6 meses) ---
  const meses = getLast6Months();
  const evolucaoMensal: DashboardMonthlyStats[] = meses.map((m) => ({
    mes: m.label,
    utilizadores: users.filter((u) => isInMonth(u.dataCriacao, m.year, m.month)).length,
    carros: carros.filter((c) => isInMonth(c.dataCriacao, m.year, m.month)).length,
    pecas: pecas.filter((p) => isInMonth(p.dataCriacao, m.year, m.month)).length,
    oficinas: oficinas.filter((o) => isInMonth(o.dataCriacao, m.year, m.month)).length,
    intencoes: intencoes.filter((i) => isInMonth(i.criadaEm, m.year, m.month)).length,
  }));

  // --- Utilizadores ativos (criaram pelo menos 1 anúncio) ---
  const criadoresAtivos = new Set<string>();
  carros.forEach((c) => { if (c.criador) criadoresAtivos.add(c.criador); if (c.criadorUid) criadoresAtivos.add(c.criadorUid); });
  pecas.forEach((p) => { if (p.criador) criadoresAtivos.add(p.criador); if (p.criadorUid) criadoresAtivos.add(p.criadorUid); });
  oficinas.forEach((o) => { if (o.criador) criadoresAtivos.add(o.criador); });
  const utilizadoresAtivos = criadoresAtivos.size;

  // --- Média de anúncios por utilizador ---
  const totalAnuncios = carros.length + pecas.length + oficinas.length;
  const mediaAnunciosPorUtilizador = users.length > 0 ? parseFloat((totalAnuncios / users.length).toFixed(1)) : 0;

  // --- Total de visualizações e mensagens ---
  const totalVisualizacoes =
    (carros.reduce((acc, c) => acc + (c.visualizacoes || 0), 0)) +
    (pecas.reduce((acc, p) => acc + (p.visualizacoes || 0), 0));

  const totalMensagens =
    (carros.reduce((acc, c) => acc + (c.contagemMensagens || 0), 0)) +
    (pecas.reduce((acc, p) => acc + (p.contagemMensagens || 0), 0));

  return {
    antiguidade,
    evolucaoMensal,
    utilizadoresAtivos,
    mediaAnunciosPorUtilizador,
    totalVisualizacoes,
    totalMensagens,
  };
}

export function subscribePremiumConfig(
  onData: (config: PremiumConfig) => void,
  onError?: (err: Error) => void,
): () => void {
  const docRef = doc(db, CONFIG_COLLECTION, PREMIUM_DOC);
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        onData({
          masterActive: data.masterActive !== false,
          impulsionamento: data.impulsionamento !== false,
          oficinas: data.oficinas !== false,
          leads: data.leads !== false,
          parceriasActive: data.parceriasActive !== false,
          financiamento: data.financiamento !== false,
          seguro: data.seguro !== false,
          atualizadoEm: data.atualizadoEm,
          atualizadoPor: data.atualizadoPor,
        });
      } else {
        onData({
          masterActive: true,
          impulsionamento: true,
          oficinas: true,
          leads: true,
          parceriasActive: true,
          financiamento: true,
          seguro: true,
        });
      }
    },
    (err) => {
      console.error('[DB] Erro no snapshot de premium config:', err);
      onError?.(err);
    },
  );
}

// ---------------------------------------------------------------------------
// Banners Collection CRUD Functions
// ---------------------------------------------------------------------------

export function subscribeBanners(
  onData: (banners: Banner[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(collection(db, BANNERS_COLLECTION), orderBy('ordem', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      const results = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Banner);
      onData(results);
    },
    (err) => {
      console.error('[DB] Erro no snapshot de banners:', err);
      onError?.(err);
    },
  );
}

export async function getBanners(): Promise<Banner[]> {
  try {
    const q = query(
      collection(db, BANNERS_COLLECTION),
      where('ativo', '==', true),
      orderBy('ordem', 'asc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Banner));
  } catch (err) {
    console.error('[DB] Erro ao buscar banners ativos:', err);
    return [];
  }
}

export async function addBanner(banner: BannerInput): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, BANNERS_COLLECTION), cleanUndefined({
      ...banner,
      dataCriacao: Timestamp.now(),
    }));
    return docRef.id;
  } catch (err) {
    console.error('[DB] Erro ao adicionar banner:', err);
    throw err;
  }
}

export async function updateBanner(id: string, updates: Partial<Banner>): Promise<void> {
  try {
    await updateDoc(doc(db, BANNERS_COLLECTION, id), cleanUndefined(updates));
  } catch (err) {
    console.error('[DB] Erro ao atualizar banner:', err);
    throw err;
  }
}

export async function deleteBanner(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, BANNERS_COLLECTION, id));
  } catch (err) {
    console.error('[DB] Erro ao deletar banner:', err);
    throw err;
  }
}


