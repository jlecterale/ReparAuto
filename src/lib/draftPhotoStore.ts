/**
 * IndexedDB persistence for picked-but-not-yet-uploaded listing photos, keyed
 * by the blob object URL stored in the draft (localStorage). localStorage
 * cannot hold Files, so this is what lets a draft restore its photos after a
 * full page reload — pendingUploadFiles.ts re-keys recovered Files under
 * fresh object URLs on restore.
 *
 * Every operation is best-effort and never throws: IndexedDB can be missing
 * (private mode, old browsers) or over quota, and the draft flow must keep
 * working without photo recovery in that case.
 */

interface StoredPhoto {
  name: string;
  type: string;
  buffer: ArrayBuffer;
  savedAt: number;
}

const DB_NAME = 'reparauto_draft_photos';
const STORE = 'photos';
/** Safety net for orphaned entries (e.g. localStorage cleared externally). */
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/** Blob.arrayBuffer() with a FileReader fallback (jsdom, older engines). */
function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === 'function') return file.arrayBuffer();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined' || !indexedDB) return resolve(null);
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/** Resolves when the transaction settles, successfully or not. */
function settled(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
    tx.onabort = () => resolve();
  });
}

export async function savePhotoFile(key: string, file: File): Promise<void> {
  try {
    // Stored as a plain ArrayBuffer — universally structured-cloneable,
    // unlike File objects on some engines.
    const buffer = await fileToArrayBuffer(file);
    const db = await openDb();
    if (!db) return;
    const tx = db.transaction(STORE, 'readwrite');
    const record: StoredPhoto = { name: file.name, type: file.type, buffer, savedAt: Date.now() };
    tx.objectStore(STORE).put(record, key);
    await settled(tx);
    db.close();
  } catch {
    /* best-effort */
  }
}

/**
 * Loads the Files saved under the given keys. Also sweeps entries past the
 * retention window (whole store — it only ever holds a handful of photos).
 */
export async function loadPhotoFiles(keys: string[]): Promise<Map<string, File>> {
  const files = new Map<string, File>();
  try {
    const db = await openDb();
    if (!db) return files;
    const wanted = new Set(keys);
    const cutoff = Date.now() - MAX_AGE_MS;
    const tx = db.transaction(STORE, 'readwrite');
    const cursorRequest = tx.objectStore(STORE).openCursor();
    cursorRequest.onsuccess = () => {
      const cursor = cursorRequest.result;
      if (!cursor) return;
      const record = cursor.value as StoredPhoto;
      const key = String(cursor.key);
      if (record.savedAt < cutoff) {
        cursor.delete();
      } else if (wanted.has(key)) {
        files.set(key, new File([record.buffer], record.name, { type: record.type }));
      }
      cursor.continue();
    };
    await settled(tx);
    db.close();
  } catch {
    /* best-effort */
  }
  return files;
}

export async function deletePhotoFiles(keys: Array<string | null | undefined>): Promise<void> {
  const valid = keys.filter((key): key is string => !!key);
  if (valid.length === 0) return;
  try {
    const db = await openDb();
    if (!db) return;
    const tx = db.transaction(STORE, 'readwrite');
    for (const key of valid) tx.objectStore(STORE).delete(key);
    await settled(tx);
    db.close();
  } catch {
    /* best-effort */
  }
}
