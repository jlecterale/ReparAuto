/**
 * Module-scope registry of picked-but-not-yet-uploaded photo files, keyed by
 * their blob object URL. Unlike a component ref, it survives route changes
 * within the same page session, so a resumed listing draft can still preview
 * and upload its photos. Object URLs (and this registry) die on a full page
 * reload — restore paths must drop entries via isRestorableFoto().
 */
const pendingUploadFiles = new Map<string, File>();

/** Whether a drafted photo entry can still be shown/uploaded. */
export function isRestorableFoto(uri: string): boolean {
  return !uri.startsWith('blob:') || pendingUploadFiles.has(uri);
}

/**
 * Free the Files (and revoke the object URLs) behind a discarded draft's
 * photos, so abandoning a draft doesn't pin megabytes until page reload.
 */
export function releasePendingFiles(uris: Array<string | null | undefined>): void {
  for (const uri of uris) {
    if (uri && pendingUploadFiles.has(uri)) {
      URL.revokeObjectURL(uri);
      pendingUploadFiles.delete(uri);
    }
  }
}

export default pendingUploadFiles;
