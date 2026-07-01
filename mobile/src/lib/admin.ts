/**
 * Admin-only Firestore access for mobile — ports the moderation helpers from the
 * web app's `src/lib/db.ts` to the react-native-firebase API. Every write here
 * is gated by `isAdmin()` in `firestore.rules`, so these functions only succeed
 * for users with `role === 'admin'`.
 *
 * Listing moderation, report handling and identity verification live here; the
 * public read/CRUD helpers stay in `./db`.
 */
import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import { db, storage } from './firebase';
import { getUserProfile, updateUserProfile } from './db';
import type {
  Carro,
  Peca,
  Oficina,
  Report,
  StatusAnuncio,
  StatusReport,
  StatusVerificacao,
  TipoNotificacao,
  Verification,
} from '@/types';

const CARROS = 'cars';
const PECAS = 'parts';
const OFICINAS = 'services';
const REPORTS = 'reports';
const VERIFICATIONS = 'verifications';
const NOTIFICATIONS = 'notifications';
const USERS = 'users';

type Snapshot = FirebaseFirestoreTypes.QuerySnapshot;
type Doc = FirebaseFirestoreTypes.QueryDocumentSnapshot;

function mapDocs<T>(snap: Snapshot): T[] {
  return snap.docs.map((d: Doc) => ({ id: d.id, ...d.data() }) as T);
}

function byMillisDesc(am: number, bm: number): number {
  return bm - am;
}

// ---------- Notifications ----------
/**
 * Creates an in-app notification for a user. The `pushOnNotification` Cloud
 * Function turns this doc into an FCM push automatically. Rules allow an admin
 * to create notifications for any uid.
 */
export async function criarNotificacao(
  uid: string,
  tipo: TipoNotificacao,
  titulo: string,
  mensagem: string,
  link?: string,
): Promise<void> {
  await db.collection(NOTIFICATIONS).add({
    uid,
    tipo,
    titulo,
    mensagem,
    link: link ?? null,
    lida: false,
    dataCriacao: firestore.FieldValue.serverTimestamp(),
  });
}

/** Resolves a listing's owner uid, preferring the stored uid over an email lookup. */
export async function notificarDono(
  criadorUid: string | undefined,
  criadorEmail: string | undefined,
  tipo: TipoNotificacao,
  titulo: string,
  mensagem: string,
  link?: string,
): Promise<void> {
  let uid = criadorUid;
  if (!uid && criadorEmail) {
    const snap = await db.collection(USERS).where('email', '==', criadorEmail).limit(1).get();
    if (!snap.empty) uid = snap.docs[0].id;
  }
  if (!uid) return;
  await criarNotificacao(uid, tipo, titulo, mensagem, link);
}

// ---------- Pending listings ----------
export async function getPendingCarros(): Promise<Carro[]> {
  const snap = await db.collection(CARROS).where('status', '==', 'pendente').get();
  return mapDocs<Carro>(snap).sort((a, b) =>
    byMillisDesc(a.dataCriacao?.toMillis?.() ?? 0, b.dataCriacao?.toMillis?.() ?? 0),
  );
}

export async function getPendingPecas(): Promise<Peca[]> {
  const snap = await db.collection(PECAS).where('status', '==', 'pendente').get();
  return mapDocs<Peca>(snap).sort((a, b) =>
    byMillisDesc(a.dataCriacao?.toMillis?.() ?? 0, b.dataCriacao?.toMillis?.() ?? 0),
  );
}

export async function getPendingOficinas(): Promise<Oficina[]> {
  const snap = await db.collection(OFICINAS).where('status', '==', 'pendente').get();
  return mapDocs<Oficina>(snap).sort((a, b) =>
    byMillisDesc(a.dataCriacao?.toMillis?.() ?? 0, b.dataCriacao?.toMillis?.() ?? 0),
  );
}

function statusUpdate(status: StatusAnuncio): Record<string, unknown> {
  const updates: Record<string, unknown> = { status };
  if (status === 'aprovado') {
    updates.dataAprovacao = firestore.FieldValue.serverTimestamp();
  }
  return updates;
}

export async function updateCarroStatus(id: string, status: StatusAnuncio): Promise<void> {
  await db.collection(CARROS).doc(id).update(statusUpdate(status));
}

export async function updatePecaStatus(id: string, status: StatusAnuncio): Promise<void> {
  await db.collection(PECAS).doc(id).update(statusUpdate(status));
}

export async function updateOficinaStatus(id: string, status: StatusAnuncio): Promise<void> {
  await db.collection(OFICINAS).doc(id).update(statusUpdate(status));
}

// ---------- Reports ----------
export async function getAllReports(): Promise<Report[]> {
  const snap = await db.collection(REPORTS).get();
  return mapDocs<Report>(snap).sort((a, b) =>
    byMillisDesc(a.dataCriacao?.toMillis?.() ?? 0, b.dataCriacao?.toMillis?.() ?? 0),
  );
}

export async function updateReportStatus(
  id: string,
  status: StatusReport,
  resolvidoPor: string,
  notasAdmin?: string,
): Promise<void> {
  const updates: Record<string, unknown> = { status, resolvidoPor };
  if (status === 'resolvido' || status === 'rejeitado') {
    updates.dataResolucao = firestore.FieldValue.serverTimestamp();
  }
  if (notasAdmin) updates.notasAdmin = notasAdmin;
  await db.collection(REPORTS).doc(id).update(updates);
}

// ---------- Verifications ----------
export async function getAllVerifications(): Promise<Verification[]> {
  const snap = await db.collection(VERIFICATIONS).get();
  return mapDocs<Verification>(snap).sort((a, b) =>
    byMillisDesc(a.dataPedido?.toMillis?.() ?? 0, b.dataPedido?.toMillis?.() ?? 0),
  );
}

/** Best-effort Storage cleanup of the sensitive document/selfie images. */
async function deleteVerificationFiles(documentoUrl: string, selfieUrl: string): Promise<void> {
  const removeByUrl = async (url: string) => {
    if (!url) return;
    try {
      await storage.refFromURL(url).delete();
    } catch {
      // Files may already be gone, or storage rules require the `admin` custom
      // claim (role-only admins can't delete) — clearing the URLs below still
      // hides them from the UI. Mirrors the web behaviour.
    }
  };
  await Promise.all([removeByUrl(documentoUrl), removeByUrl(selfieUrl)]);
}

async function clearVerificationUrls(id: string): Promise<void> {
  await db
    .collection(VERIFICATIONS)
    .doc(id)
    .update({ documentoUrl: '', selfieUrl: '' })
    .catch(() => {});
}

/**
 * Approves or rejects a verification request, applying the same side effects as
 * the web (`useVerificationsAdmin`): on approval flags the user `verificado`
 * (and adds the `profissional` badge when applicable), always wipes the document
 * files, and notifies the user.
 */
export async function decidirVerificacao(
  v: Verification,
  status: Extract<StatusVerificacao, 'aprovado' | 'rejeitado'>,
  resolvidoPor: string,
  notasAdmin?: string,
): Promise<void> {
  await db
    .collection(VERIFICATIONS)
    .doc(v.id)
    .update({
      status,
      resolvidoPor,
      dataResolucao: firestore.FieldValue.serverTimestamp(),
      ...(notasAdmin ? { notasAdmin } : {}),
    });

  if (status === 'aprovado') {
    const updates: Partial<{ verificado: boolean; badges: string[] }> = { verificado: true };
    if (v.tipo === 'profissional') {
      const profile = await getUserProfile(v.uid);
      const existing = (profile?.badges ?? []).filter((b) => b !== 'profissional');
      updates.badges = [...existing, 'profissional'];
    }
    await updateUserProfile(v.uid, updates);
  }

  await deleteVerificationFiles(v.documentoUrl, v.selfieUrl);
  await clearVerificationUrls(v.id);

  if (status === 'aprovado') {
    await criarNotificacao(
      v.uid,
      'aprovado',
      'Conta verificada!',
      'A sua conta foi verificada com sucesso pela equipa RecarGarage.',
    );
  } else {
    await criarNotificacao(
      v.uid,
      'rejeitado',
      'Verificação recusada',
      notasAdmin
        ? `O seu pedido de verificação foi recusado: ${notasAdmin}`
        : 'O seu pedido de verificação foi recusado. Pode tentar novamente com documentos válidos.',
    );
  }
}
