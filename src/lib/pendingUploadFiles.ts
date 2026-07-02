/**
 * Registry of picked-but-not-yet-uploaded photo files, keyed by their blob
 * object URL. The module-scope Map survives route changes within the same
 * page session; each registered file is also persisted to IndexedDB (see
 * draftPhotoStore.ts) so a listing draft can restore its photos after a full
 * page reload via restoreDraftPhotos(), which re-keys recovered Files under
 * fresh object URLs.
 */
import { savePhotoFile, loadPhotoFiles, deletePhotoFiles } from '@/lib/draftPhotoStore';

const pendingUploadFiles = new Map<string, File>();

/** Whether a drafted photo entry is usable without hitting IndexedDB. */
export function isRestorableFoto(uri: string): boolean {
  return !uri.startsWith('blob:') || pendingUploadFiles.has(uri);
}

/** Registers a picked file in the session Map and persists it for recovery. */
export async function registerPendingFile(url: string, file: File): Promise<void> {
  pendingUploadFiles.set(url, file);
  await savePhotoFile(url, file);
}

/** Fully forgets one photo: revokes its URL and frees Map + IndexedDB copies. */
export async function unregisterPendingFile(url: string): Promise<void> {
  URL.revokeObjectURL(url);
  pendingUploadFiles.delete(url);
  await deletePhotoFiles([url]);
}

/**
 * Frees the Files (and revokes the object URLs) behind a discarded draft's
 * photos — including the persisted copies of blob URLs that already died in
 * a previous session, so a discarded draft can never be recovered.
 */
export async function releasePendingFiles(uris: Array<string | null | undefined>): Promise<void> {
  const blobUris: string[] = [];
  for (const uri of uris) {
    if (!uri || !uri.startsWith('blob:')) continue;
    blobUris.push(uri);
    if (pendingUploadFiles.has(uri)) {
      URL.revokeObjectURL(uri);
      pendingUploadFiles.delete(uri);
    }
  }
  await deletePhotoFiles(blobUris);
}

/**
 * Rebuilds a draft's photo list after a possible reload. Non-blob entries
 * (https URLs, emojis) and blob URLs still alive in the Map pass through;
 * dead blob URLs are recovered from IndexedDB and re-keyed under fresh
 * object URLs. Unrecoverable photos are dropped and counted in lostCount so
 * callers can tell the user what was lost.
 */
export async function restoreDraftPhotos(
  saved: string[],
): Promise<{ fotos: string[]; lostCount: number }> {
  const deadUrls = saved.filter((foto) => foto.startsWith('blob:') && !pendingUploadFiles.has(foto));
  const recovered = deadUrls.length > 0 ? await loadPhotoFiles(deadUrls) : new Map<string, File>();

  const fotos: string[] = [];
  const rekeys: Promise<void>[] = [];
  let lostCount = 0;
  for (const foto of saved) {
    if (!foto.startsWith('blob:') || pendingUploadFiles.has(foto)) {
      fotos.push(foto);
      continue;
    }
    const file = recovered.get(foto);
    if (!file) {
      lostCount++;
      continue;
    }
    const url = URL.createObjectURL(file);
    pendingUploadFiles.set(url, file);
    rekeys.push(savePhotoFile(url, file));
    fotos.push(url);
  }
  await Promise.all(rekeys);
  // Old keys are dead URLs — their persisted copies were just re-keyed (or lost).
  await deletePhotoFiles(deadUrls);
  return { fotos, lostCount };
}

export default pendingUploadFiles;
