import type { StatusAnuncio } from '@/types/carro';

/**
 * Moderation policy for owner edits of a listing (car or part).
 *
 * Photos are the moderation-sensitive part of a listing (inappropriate or
 * misleading images are what admins police), so only a photo change re-queues
 * the ad for approval. Any other edit — price, description, specs — keeps the
 * current status, so an already-approved ad stays live instead of disappearing
 * from the marketplace until an admin re-approves it.
 */

type Photo = string | null | undefined;

/**
 * True when the set of photos differs (a photo was added, removed, or
 * replaced). Comparison is order-independent — reordering the same approved
 * images introduces no new content to moderate — and empty entries are ignored.
 */
export function listingPhotosChanged(previous: readonly Photo[], next: readonly Photo[]): boolean {
  const before = new Set(previous.filter(Boolean));
  const after = new Set(next.filter(Boolean));
  if (before.size !== after.size) return true;
  for (const photo of after) {
    if (!before.has(photo)) return true;
  }
  return false;
}

/**
 * Status to persist when an owner saves an edit: `'pendente'` (re-review) if the
 * photos changed, otherwise the listing's current status unchanged.
 */
export function statusAfterOwnerEdit(
  currentStatus: StatusAnuncio,
  previousPhotos: readonly Photo[],
  nextPhotos: readonly Photo[],
): StatusAnuncio {
  return listingPhotosChanged(previousPhotos, nextPhotos) ? 'pendente' : currentStatus;
}
