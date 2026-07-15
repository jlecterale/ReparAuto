/**
 * Local, UX-only mirror of the weekly AI quota (plan 4.1 §2.2 layer 1).
 *
 * The authoritative counter lives in the Cloud Function proxy, which derives
 * the window key from SERVER time and enforces the cap in a transaction. This
 * only remembers the last `remaining` the server reported so the UI can
 * disable buttons without a round-trip — never trust it for security.
 *
 * AsyncStorage (async) is the mobile counterpart of the web's localStorage.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'ai_quota_v1';

/** Monday (UTC) of the date's week, e.g. `w-2026-06-29`. Mirrors the server. */
export function weekKeyFromDate(date: Date): string {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utc.getUTCDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? 6 : day - 1;
  utc.setUTCDate(utc.getUTCDate() - diffToMonday);
  return `w-${utc.toISOString().slice(0, 10)}`;
}

interface StoredQuota {
  uid: string;
  weekKey: string;
  remaining: number;
}

export async function getStoredAiRemaining(uid: string, weekKey: string): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as StoredQuota) : null;
    if (!parsed || parsed.uid !== uid || parsed.weekKey !== weekKey) return null;
    return typeof parsed.remaining === 'number' ? parsed.remaining : null;
  } catch {
    return null;
  }
}

export async function storeAiRemaining(uid: string, weekKey: string, remaining: number): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ uid, weekKey, remaining }));
  } catch {
    // Best-effort UX cache only.
  }
}
