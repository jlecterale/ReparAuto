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

export default pendingUploadFiles;
