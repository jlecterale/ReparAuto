import { useCallback, useSyncExternalStore } from 'react';
import { toggleCompareId } from '@/lib/compare';

// Tiny module-level store shared by every card, the compare bar and the
// compare screen. In-memory only: a comparison is ephemeral, so it survives
// navigation but resets when the app restarts (mirrors the web's
// sessionStorage semantics).
let ids: string[] = [];
const listeners = new Set<() => void>();

function save(next: string[]): void {
  ids = next;
  listeners.forEach((notify) => notify());
}

function subscribe(notify: () => void): () => void {
  listeners.add(notify);
  return () => listeners.delete(notify);
}

const getSnapshot = () => ids;

export function useCompare() {
  const selection = useSyncExternalStore(subscribe, getSnapshot);

  const toggle = useCallback((id: string): boolean => {
    const next = toggleCompareId(ids, id);
    // Both adding and removing change the length; a rejected add doesn't.
    const accepted = next.length !== ids.length;
    if (accepted) save(next);
    return accepted;
  }, []);

  const clear = useCallback(() => save([]), []);

  return { ids: selection, toggle, clear };
}
