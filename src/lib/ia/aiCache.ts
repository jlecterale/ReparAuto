/**
 * Idempotency cache for AI results (plan 4.1 §3.7): the same normalized input
 * must not spend a new generation. Small LRU persisted in localStorage.
 */

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

function readCache(): CacheMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as CacheMap) : {};
  } catch {
    return {};
  }
}

function writeCache(cache: CacheMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Storage full/unavailable — cache is best-effort only.
  }
}

export function getCachedAiResult<T = unknown>(key: string): T | null {
  const cache = readCache();
  return key in cache ? (cache[key] as T) : null;
}

export function setCachedAiResult(key: string, value: unknown): void {
  const cache = readCache();
  delete cache[key];
  cache[key] = value;
  // Object insertion order doubles as recency — drop the oldest keys first.
  const keys = Object.keys(cache);
  for (let i = 0; i < keys.length - MAX_ENTRIES; i++) {
    delete cache[keys[i]];
  }
  writeCache(cache);
}
