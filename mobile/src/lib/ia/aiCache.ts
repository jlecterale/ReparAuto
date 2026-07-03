/**
 * Idempotency cache for AI results (plan 4.1 §3.7): the same normalized input
 * must not spend a new generation. Small LRU persisted in AsyncStorage.
 * Mirrors the web `src/lib/ia/aiCache.ts` (localStorage → AsyncStorage).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'ai_cache_v1';
const MAX_ENTRIES = 20;

type CacheMap = Record<string, unknown>;

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`);
  return `{${entries.join(',')}}`;
}

/** djb2 — enough for a cache key; not cryptographic. */
function hashString(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
}

export function aiCacheKey(feature: string, payload: unknown): string {
  return `${feature}:${hashString(stableStringify(payload))}`;
}

async function readCache(): Promise<CacheMap> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as CacheMap) : {};
  } catch {
    return {};
  }
}

export async function getCachedAiResult<T = unknown>(key: string): Promise<T | null> {
  const cache = await readCache();
  return key in cache ? (cache[key] as T) : null;
}

// Serialize the read-modify-write so two AI calls resolving at once (e.g.
// description + price) don't each write back their own snapshot and clobber
// the other's entry — which would waste a generation on the next identical tap.
let writeChain: Promise<void> = Promise.resolve();

export function setCachedAiResult(key: string, value: unknown): Promise<void> {
  writeChain = writeChain.then(async () => {
    const cache = await readCache();
    delete cache[key];
    cache[key] = value;
    // Object insertion order doubles as recency — drop the oldest keys first.
    const keys = Object.keys(cache);
    for (let i = 0; i < keys.length - MAX_ENTRIES; i++) {
      delete cache[keys[i]];
    }
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
    } catch {
      // Storage full/unavailable — cache is best-effort only.
    }
  });
  // Never let one failed write reject the shared chain and block later writes.
  writeChain = writeChain.catch(() => {});
  return writeChain;
}
