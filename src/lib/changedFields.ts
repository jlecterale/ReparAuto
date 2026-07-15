function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)
  );
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, i) => deepEqual(item, b[i]));
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    return keysA.length === keysB.length && keysA.every((k) => deepEqual(a[k], b[k]));
  }
  return false;
}

/**
 * Filters an edit-form payload down to the fields that actually differ from
 * the current document, so updateDoc only writes real changes. An unchanged
 * form yields `{}` — callers should then skip the write entirely.
 * `undefined` values are always dropped (Firestore rejects them).
 */
export function pickChangedFields(
  original: object,
  updates: Record<string, unknown>,
): Record<string, unknown> {
  const current = original as Record<string, unknown>;
  const changed: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) continue;
    if (!deepEqual(value, current[key])) changed[key] = value;
  }
  return changed;
}
