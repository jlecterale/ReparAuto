'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { toggleCompareId } from '@/lib/compare';

// Tiny module-level store shared by every card and the compare bar, so the
// selection survives navigation between client routes. sessionStorage keeps
// it per-tab and drops it when the tab closes (a comparison is ephemeral).
const STORAGE_KEY = 'compare_cars';

let ids: string[] | null = null;
const listeners = new Set<() => void>();

function load(): string[] {
  if (ids !== null) return ids;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    ids = Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    ids = [];
  }
  return ids;
}

function save(next: string[]): void {
  ids = next;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable (private mode/quota) — selection stays in memory.
  }
  listeners.forEach((notify) => notify());
}

function subscribe(notify: () => void): () => void {
  listeners.add(notify);
  return () => listeners.delete(notify);
}

const EMPTY: string[] = [];
const getServerSnapshot = () => EMPTY;

/** Test-only: resets the in-memory store (optionally keeping sessionStorage). */
export function resetCompareStoreForTests(options?: { keepStorage?: boolean }): void {
  ids = null;
  if (!options?.keepStorage) {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}

export default function useCompare() {
  const selection = useSyncExternalStore(subscribe, load, getServerSnapshot);

  const toggle = useCallback((id: string): boolean => {
    const current = load();
    const next = toggleCompareId(current, id);
    // Both adding and removing change the length; a rejected add doesn't.
    const accepted = next.length !== current.length;
    if (accepted) save(next);
    return accepted;
  }, []);

  const clear = useCallback(() => save([]), []);

  return { ids: selection, toggle, clear };
}
