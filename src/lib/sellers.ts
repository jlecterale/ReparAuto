/**
 * Pure helpers for seller-level metadata on listings (verified badge and
 * result prioritization). No I/O here — everything is unit-testable.
 */

interface HasCreator {
  criadorUid?: string;
}

/** Unique creator uids present in a listing collection, first-seen order. */
export function collectSellerUids(items: readonly HasCreator[]): string[] {
  const seen = new Set<string>();
  for (const item of items) {
    if (item.criadorUid) seen.add(item.criadorUid);
  }
  return [...seen];
}

/**
 * Stable partition: listings from verified sellers first, everything else
 * after, preserving the incoming (recency) order inside each group.
 */
export function prioritizeVerified<T extends HasCreator>(
  items: readonly T[],
  verified: ReadonlySet<string>,
): T[] {
  if (verified.size === 0) return [...items];
  const first: T[] = [];
  const rest: T[] = [];
  for (const item of items) {
    (item.criadorUid && verified.has(item.criadorUid) ? first : rest).push(item);
  }
  return [...first, ...rest];
}

/** Splits an array into consecutive chunks of at most `size` elements. */
export function chunkArray<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}
