import type { StatusAnuncio } from '@/types/carro';

/**
 * Moderation policy for owner edits of a listing (car or part).
 *
 * Photos are the moderation-sensitive part of a listing (inappropriate or
 * misleading images are what admins police), so only a *new* image re-queues
 * the ad for approval. Adding or replacing a photo brings in unreviewed content;
 * removing a photo, reordering, or editing price/description/specs does not, so
 * an already-approved ad stays live instead of disappearing until re-approval.
 */

type Photo = string | null | undefined;

/**
 * True when the edit introduces a photo that wasn't there before — a photo was
 * added or an existing one replaced. Removing photos or reordering them does not
 * count: no new image means nothing new to moderate. Empty entries are ignored.
 */
export function listingPhotosAddedOrReplaced(
  previous: readonly Photo[],
  next: readonly Photo[],
): boolean {
  const before = new Set(previous.filter(Boolean));
  for (const photo of next) {
    if (photo && !before.has(photo)) return true;
  }
  return false;
}

/**
 * Status to persist when an owner saves an edit: `'pendente'` (re-review) if a
 * photo was added or replaced, otherwise the listing's current status unchanged.
 */
export function statusAfterOwnerEdit(
  currentStatus: StatusAnuncio,
  previousPhotos: readonly Photo[],
  nextPhotos: readonly Photo[],
): StatusAnuncio {
  return listingPhotosAddedOrReplaced(previousPhotos, nextPhotos) ? 'pendente' : currentStatus;
}
