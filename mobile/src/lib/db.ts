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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logPublishListing } from './analytics';
import { db, storage } from './firebase';
import { getActiveCountry, getBindingCountry } from './country';
import type { Carro, Peca, Oficina, Usuario, Verification, VerificationInput } from '@/types';

/** Firestore rejects `undefined`; drop those keys before writing. */
function cleanUndefined<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as T;
}

/**
 * For updates, an `undefined` optional field means the user cleared it, so it
 * must be written as `null` to actually blank the stored value — dropping the
 * key (as on create) would silently keep the old value.
 */
function nullifyUndefined<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, v === undefined ? null : v]),
  );
}

const CARROS = 'cars';
const PECAS = 'parts';
const OFICINAS = 'services';
const USERS = 'users';
const VERIFICATIONS = 'verifications';

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

/**
 * Uploads a local image (file:// URI from the picker/camera) to
 * `ads/{uid}/...` and returns its download URL — same Storage layout the web
 * app uses, allowed by `storage.rules`.
 */
export async function uploadAnuncioFoto(
  uid: string,
  localUri: string,
  index: number,
): Promise<string> {
  const ext = (localUri.split('.').pop() || 'jpg').split('?')[0].toLowerCase();
  const ref = storage.ref(`ads/${uid}/${Date.now()}_${index}.${ext}`);
  await ref.putFile(localUri);
  return ref.getDownloadURL();
}

/**
 * Keeps an already-uploaded photo (https download URL) as-is, uploading only a
 * fresh local `file://` pick. Shared by the create/edit forms so editing a
 * listing doesn't re-upload images that are already in Storage.
 */
export async function uploadFotoIfLocal(
  uid: string,
  uri: string,
  index: number,
): Promise<string> {
  return uri.startsWith('http') ? uri : uploadAnuncioFoto(uid, uri, index);
}

/** Creates a car listing as `pendente` (admin approves before it goes public). */
export async function addCarro(dados: Record<string, unknown>): Promise<string> {
  const docRef = await db.collection(CARROS).add(
    cleanUndefined({
      // Stamp the active market; callers may override via `dados`.
      country: getActiveCountry(),
      ...dados,
      status: 'pendente',
      dataCriacao: firestore.FieldValue.serverTimestamp(),
    }),
  );
  logPublishListing('carro', docRef.id);
  return docRef.id;
}

// ---------- Peças ----------
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

export async function getPecaById(id: string): Promise<Peca | null> {
  const doc = await db.collection(PECAS).doc(id).get();
  return doc.exists() ? ({ id: doc.id, ...doc.data() } as Peca) : null;
}

// ---------- Oficinas ----------
export function subscribeOficinas(
  onData: (oficinas: Oficina[]) => void,
  onError?: (err: Error) => void,
): () => void {
  return db
    .collection(OFICINAS)
    .where('status', '==', 'aprovado')
    .onSnapshot(
      (snap) => onData(mapDocs<Oficina>(snap).sort(byDataCriacaoDesc)),
      (err) => onError?.(err),
    );
}

export async function getOficinaById(id: string): Promise<Oficina | null> {
  const doc = await db.collection(OFICINAS).doc(id).get();
  return doc.exists() ? ({ id: doc.id, ...doc.data() } as Oficina) : null;
}

/** Creates a part listing as `pendente`. */
export async function addPeca(dados: Record<string, unknown>): Promise<string> {
  const docRef = await db.collection(PECAS).add(
    cleanUndefined({
      // Stamp the active market; callers may override via `dados`.
      country: getActiveCountry(),
      ...dados,
      status: 'pendente',
      dataCriacao: firestore.FieldValue.serverTimestamp(),
    }),
  );
  logPublishListing('peca', docRef.id);
  return docRef.id;
}

/** Creates a workshop (service) as `pendente`. */
export async function addOficina(dados: Record<string, unknown>): Promise<string> {
  const docRef = await db.collection(OFICINAS).add(
    cleanUndefined({
      // Stamp the active market; callers may override via `dados`.
      country: getActiveCountry(),
      ...dados,
      status: 'pendente',
      dataCriacao: firestore.FieldValue.serverTimestamp(),
    }),
  );
  logPublishListing('oficina', docRef.id);
  return docRef.id;
}

// ---------- User's own listings ----------
export async function getCarrosByCreator(email: string): Promise<Carro[]> {
  const snap = await db.collection(CARROS).where('criador', '==', email).get();
  return mapDocs<Carro>(snap).sort(byDataCriacaoDesc);
}

export async function getPecasByCreator(email: string): Promise<Peca[]> {
  const snap = await db.collection(PECAS).where('criador', '==', email).get();
  return mapDocs<Peca>(snap).sort(byDataCriacaoDesc);
}

export async function getOficinasByCreator(email: string): Promise<Oficina[]> {
  const snap = await db.collection(OFICINAS).where('criador', '==', email).get();
  return mapDocs<Oficina>(snap).sort(byDataCriacaoDesc);
}

/**
 * Updates an existing listing the signed-in user owns. The security rules allow
 * `update` only for the creator (matched by email) and the web app resets
 * `status` to `pendente` on user edits so changes are re-reviewed — we mirror
 * that by having callers pass `status: 'pendente'`.
 */
export async function updateCarro(id: string, dados: Record<string, unknown>): Promise<void> {
  await db.collection(CARROS).doc(id).update(nullifyUndefined(dados));
}

export async function updatePeca(id: string, dados: Record<string, unknown>): Promise<void> {
  await db.collection(PECAS).doc(id).update(nullifyUndefined(dados));
}

export async function updateOficina(id: string, dados: Record<string, unknown>): Promise<void> {
  await db.collection(OFICINAS).doc(id).update(nullifyUndefined(dados));
}

export async function deleteCarro(id: string): Promise<void> {
  await db.collection(CARROS).doc(id).delete();
}

export async function deletePeca(id: string): Promise<void> {
  await db.collection(PECAS).doc(id).delete();
}

export async function deleteOficina(id: string): Promise<void> {
  await db.collection(OFICINAS).doc(id).delete();
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
  // Accounts belong to one market, bound at signup. Await the first-launch
  // resolution so a signup racing the AsyncStorage/GeoIP detection can't
  // stamp the wrong market; an explicit caller value always wins.
  const country = (data.country as string) ?? (await getBindingCountry());
  await db
    .collection(USERS)
    .doc(uid)
    .set(
      {
        ...data,
        country,
        dataCriacao: firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
}

export async function updateUserProfile(
  uid: string,
  data: Partial<Usuario>,
): Promise<void> {
  await db.collection(USERS).doc(uid).set(data, { merge: true });
}

export async function deleteUserProfile(uid: string): Promise<void> {
  await db.collection(USERS).doc(uid).delete();
}

// ---------- Favoritos ----------
/** Reads the favourites array stored on the user document. */
export async function getFavoritosRemoto(uid: string): Promise<string[]> {
  const doc = await db.collection(USERS).doc(uid).get();
  const data = doc.data();
  return Array.isArray(data?.favoritos) ? (data!.favoritos as string[]) : [];
}

/** Persists the favourites array on the user document. */
export async function saveFavoritosRemoto(
  uid: string,
  favoritos: string[],
): Promise<void> {
  await db.collection(USERS).doc(uid).set({ favoritos }, { merge: true });
}

/**
 * Atomically bumps a numeric counter. Firestore queues the write while offline
 * and syncs on reconnect, so no manual offline queue is needed (unlike web).
 * The security rules whitelist `contagemFavoritos` bumps on `cars`.
 */
export async function bumpContador(
  colecao: 'cars' | 'parts',
  id: string,
  campo: string,
  delta: 1 | -1,
): Promise<void> {
  await db
    .collection(colecao)
    .doc(id)
    .update({ [campo]: firestore.FieldValue.increment(delta) });
}

/**
 * Bumps `visualizacoes` once per device per listing (mirrors the web's
 * per-session `sessionStorage` dedup). Best-effort: never throws into the UI,
 * and skips the AsyncStorage flag if the bump fails so it can retry later.
 * `firestore.rules` allows unauthenticated `visualizacoes` increments.
 */
export async function registarVisualizacao(
  colecao: 'cars' | 'parts',
  id: string,
): Promise<void> {
  try {
    const key = `viewed_${colecao}_${id}`;
    if (await AsyncStorage.getItem(key)) return;
    await bumpContador(colecao, id, 'visualizacoes', 1);
    await AsyncStorage.setItem(key, '1');
  } catch {
    // view counting is non-critical; ignore failures.
  }
}

// ---------- Verificações ----------
/**
 * Uploads a verification image (document or selfie, local file:// URI) to
 * `verifications/{uid}/...` — the owner-writable path in `storage.rules`
 * (image only, 5MB max; readable by the owner and admins, wiped after the
 * admin decision). Reports upload progress as a 0–1 fraction.
 */
export async function uploadVerificationImage(
  uid: string,
  localUri: string,
  name: 'documento' | 'selfie',
  onProgress?: (fraction: number) => void,
): Promise<string> {
  const ext = (localUri.split('.').pop() || 'jpg').split('?')[0].toLowerCase();
  const ref = storage.ref(`verifications/${uid}/${name}_${Date.now()}.${ext}`);
  const task = ref.putFile(localUri);
  task.on('state_changed', (snap) => {
    if (snap.totalBytes > 0) onProgress?.(snap.bytesTransferred / snap.totalBytes);
  });
  await task;
  return ref.getDownloadURL();
}

/** Creates a verification request as `pendente` (an admin approves/rejects it). */
export async function addVerification(data: VerificationInput): Promise<Verification> {
  const docRef = await db.collection(VERIFICATIONS).add(
    cleanUndefined({
      ...data,
      dataPedido: firestore.FieldValue.serverTimestamp(),
    }),
  );
  return { id: docRef.id, ...data } as Verification;
}

/**
 * The user's most recent verification request, or null. Filtering by own uid
 * keeps the query provable against the `verifications` read rule; sorting
 * stays in memory (no composite index), like every other list read here.
 */
export async function getVerificationByUid(uid: string): Promise<Verification | null> {
  const snap = await db.collection(VERIFICATIONS).where('uid', '==', uid).get();
  if (snap.empty) return null;
  const [latest] = mapDocs<Verification>(snap).sort(
    (a, b) => (b.dataPedido?.toMillis?.() ?? 0) - (a.dataPedido?.toMillis?.() ?? 0),
  );
  return latest;
}
