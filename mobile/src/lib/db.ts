/**
 * Client Firestore access for mobile — ports the web app's `src/lib/db.ts`
 * read patterns to the react-native-firebase API. Crucially, it keeps the same
 * query shape the security rules expect: public listings filter
 * `status == 'aprovado'` server-side and sort by `dataCriacao` in memory (no
 * composite index needed), exactly like the web.
 */
import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import { db } from './firebase';
import type { Carro, Peca, Oficina, Usuario } from '@/types';

const CARROS = 'cars';
const PECAS = 'parts';
const OFICINAS = 'services';
const USERS = 'users';

type Snapshot = FirebaseFirestoreTypes.QuerySnapshot;
type Doc = FirebaseFirestoreTypes.QueryDocumentSnapshot;

function mapDocs<T>(snap: Snapshot): T[] {
  return snap.docs.map((d: Doc) => ({ id: d.id, ...d.data() }) as T);
}

function byDataCriacaoDesc<T extends { dataCriacao?: FirebaseFirestoreTypes.Timestamp }>(
  a: T,
  b: T,
): number {
  const am = a.dataCriacao?.toMillis?.() ?? 0;
  const bm = b.dataCriacao?.toMillis?.() ?? 0;
  return bm - am;
}

// ---------- Carros ----------
export async function getCarros(): Promise<Carro[]> {
  const snap = await db.collection(CARROS).where('status', '==', 'aprovado').get();
  return mapDocs<Carro>(snap).sort(byDataCriacaoDesc);
}

export function subscribeCarros(
  onData: (carros: Carro[]) => void,
  onError?: (err: Error) => void,
): () => void {
  return db
    .collection(CARROS)
    .where('status', '==', 'aprovado')
    .onSnapshot(
      (snap) => onData(mapDocs<Carro>(snap).sort(byDataCriacaoDesc)),
      (err) => onError?.(err),
    );
}

export async function getCarroById(id: string): Promise<Carro | null> {
  const doc = await db.collection(CARROS).doc(id).get();
  return doc.exists() ? ({ id: doc.id, ...doc.data() } as Carro) : null;
}

// ---------- Peças ----------
export async function getPecas(): Promise<Peca[]> {
  const snap = await db.collection(PECAS).where('status', '==', 'aprovado').get();
  return mapDocs<Peca>(snap).sort(byDataCriacaoDesc);
}

export function subscribePecas(
  onData: (pecas: Peca[]) => void,
  onError?: (err: Error) => void,
): () => void {
  return db
    .collection(PECAS)
    .where('status', '==', 'aprovado')
    .onSnapshot(
      (snap) => onData(mapDocs<Peca>(snap).sort(byDataCriacaoDesc)),
      (err) => onError?.(err),
    );
}

// ---------- Oficinas ----------
export async function getOficinas(): Promise<Oficina[]> {
  const snap = await db.collection(OFICINAS).where('status', '==', 'aprovado').get();
  return mapDocs<Oficina>(snap).sort(byDataCriacaoDesc);
}

// ---------- Users ----------
export async function getUserProfile(uid: string): Promise<Usuario | null> {
  const doc = await db.collection(USERS).doc(uid).get();
  return doc.exists() ? ({ uid: doc.id, ...doc.data() } as Usuario) : null;
}

export async function createUserProfile(
  uid: string,
  data: Record<string, unknown>,
): Promise<void> {
  await db
    .collection(USERS)
    .doc(uid)
    .set(
      { ...data, dataCriacao: firestore.FieldValue.serverTimestamp() },
      { merge: true },
    );
}

export async function updateUserProfile(
  uid: string,
  data: Partial<Usuario>,
): Promise<void> {
  await db.collection(USERS).doc(uid).set(data, { merge: true });
}
