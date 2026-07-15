/**
 * Alert subscriptions + notification preferences Firestore access (plan 3.1
 * — mobile). Ports the web's `src/lib/db.ts` alertSubscriptions CRUD to the
 * react-native-firebase API, matching the exact query shape
 * `firestore.rules` expects (owner-scoped `alertSubscriptions`).
 */
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { db } from './firebase';
import {
  MAX_ALERT_SUBSCRIPTIONS,
  normalizeNotificationPreferences,
  sanitizeAlertSubscriptionInput,
  sanitizeAlertText,
  MAX_ALERT_TEXT_LENGTH,
} from './alertsSanitize';
import type { AlertSubscription, AlertSubscriptionInput, NotificationPreferences, Usuario } from '@/types';

const ALERT_SUBSCRIPTIONS = 'alertSubscriptions';
const USERS = 'users';

export const ALERT_INVALID_ERROR = 'alert/invalid';
export const ALERT_LIMIT_ERROR = 'alert/limit-reached';

type Snapshot = FirebaseFirestoreTypes.QuerySnapshot;

function mapDocs(snap: Snapshot): AlertSubscription[] {
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AlertSubscription);
}

function byDataCriacaoDesc(a: AlertSubscription, b: AlertSubscription): number {
  const am = a.dataCriacao?.toMillis?.() ?? 0;
  const bm = b.dataCriacao?.toMillis?.() ?? 0;
  return bm - am;
}

/**
 * Creates an alert subscription for the signed-in user. Input is sanitized
 * locally (first defense layer) and re-validated by the Firestore rules;
 * the per-user cap is a UX quota — the authoritative matching runs in
 * Cloud Functions, which only reads `ativo == true` docs.
 */
export async function criarAlerta(
  uid: string,
  input: AlertSubscriptionInput,
): Promise<AlertSubscription> {
  const sanitized = sanitizeAlertSubscriptionInput(input);
  if (!sanitized) throw new Error(ALERT_INVALID_ERROR);

  const existing = await db.collection(ALERT_SUBSCRIPTIONS).where('uid', '==', uid).get();
  if (existing.size >= MAX_ALERT_SUBSCRIPTIONS) throw new Error(ALERT_LIMIT_ERROR);

  const data = {
    ...sanitized,
    uid,
    novosResultados: 0,
    dataCriacao: firestore.FieldValue.serverTimestamp(),
  };
  const docRef = await db.collection(ALERT_SUBSCRIPTIONS).add(data);
  return { id: docRef.id, ...data } as AlertSubscription;
}

export function subscribeAlertas(
  uid: string,
  onData: (alertas: AlertSubscription[]) => void,
  onError?: (err: Error) => void,
): () => void {
  return db
    .collection(ALERT_SUBSCRIPTIONS)
    .where('uid', '==', uid)
    .onSnapshot(
      (snap) => onData(mapDocs(snap).sort(byDataCriacaoDesc)),
      (err) => onError?.(err),
    );
}

export async function atualizarAlerta(
  id: string,
  updates: Partial<Pick<AlertSubscription, 'nome' | 'ativo' | 'novosResultados'>>,
): Promise<void> {
  const safe: Record<string, unknown> = {};
  if (typeof updates.nome === 'string') {
    const nome = sanitizeAlertText(updates.nome, MAX_ALERT_TEXT_LENGTH);
    if (nome) safe.nome = nome;
  }
  if (typeof updates.ativo === 'boolean') safe.ativo = updates.ativo;
  if (updates.novosResultados === 0) safe.novosResultados = 0;
  if (Object.keys(safe).length === 0) return;
  await db.collection(ALERT_SUBSCRIPTIONS).doc(id).update(safe);
}

export async function apagarAlerta(id: string): Promise<void> {
  await db.collection(ALERT_SUBSCRIPTIONS).doc(id).delete();
}

// ---------- Notification preferences (shared with web via users/{uid}.notifPrefs) ----------

export async function getPreferenciasNotificacao(uid: string): Promise<NotificationPreferences> {
  const doc = await db.collection(USERS).doc(uid).get();
  return normalizeNotificationPreferences((doc.data() as Usuario | undefined)?.notifPrefs);
}

/**
 * Writes the FULL preferences object, not a partial patch: `notifPrefs` is a
 * nested map shared with the web app, and Firestore's `merge: true` replaces
 * whole map fields wholesale — sending only the groups mobile has a UI for
 * would silently wipe out `mensagem`/`conta` if the user had set those on
 * web. Callers must normalize first, mutate, then pass the full object back.
 */
export async function atualizarPreferenciasNotificacao(
  uid: string,
  prefs: NotificationPreferences,
): Promise<void> {
  await db.collection(USERS).doc(uid).set({ notifPrefs: prefs }, { merge: true });
}
