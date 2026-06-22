/**
 * Brands & models data access — the source of truth is the Firestore
 * `marcas_modelos` collection (each doc id is the brand name, with fields
 * `tipos`, `modelos`, `ativo`). This ports the web `useMarcasModelos` read
 * pattern to react-native-firebase and caches the result in AsyncStorage for
 * 24h so the picker opens instantly and keeps working offline.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from './firebase';
import { MARCAS_MODELOS_COLLECTION } from './constants';
import type { MarcaModeloDoc } from '@/types';

const CACHE_KEY = 'marcas_modelos_cache';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

interface Cache {
  timestamp: number;
  dados: MarcaModeloDoc[];
}

/**
 * Process-lifetime memo so the several consumers that mount the hook (both
 * filter sheets + each form) share a single AsyncStorage parse / Firestore
 * read instead of each firing their own. `inflight` dedups concurrent first
 * calls; `memo` serves resolved data until the TTL expires.
 */
let memo: Cache | null = null;
let inflight: Promise<MarcaModeloDoc[]> | null = null;

async function readCache(): Promise<Cache | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Cache) : null;
  } catch {
    return null;
  }
}

async function writeCache(dados: MarcaModeloDoc[]): Promise<void> {
  try {
    await AsyncStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ timestamp: Date.now(), dados } satisfies Cache),
    );
  } catch {
    // storage might be unavailable — non-fatal
  }
}

/**
 * Returns the active brand/model docs. Uses a fresh AsyncStorage cache when
 * available, otherwise reads Firestore; on any read error it falls back to a
 * stale cache (if any) so the UI never ends up with nothing.
 */
export async function getMarcasModelos(): Promise<MarcaModeloDoc[]> {
  if (memo && Date.now() - memo.timestamp < CACHE_TTL_MS) return memo.dados;
  if (inflight) return inflight;

  inflight = (async () => {
    const cached = await readCache();
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      memo = cached;
      return cached.dados;
    }

    try {
      const snap = await db
        .collection(MARCAS_MODELOS_COLLECTION)
        .where('ativo', '==', true)
        .get();
      const dados = snap.docs
        .map((d) => ({ ...(d.data() as MarcaModeloDoc), nome: d.id }))
        .sort((a, b) => a.nome.localeCompare(b.nome));
      memo = { timestamp: Date.now(), dados };
      await writeCache(dados);
      return dados;
    } catch {
      // Offline / permission error → serve whatever we cached before, even stale.
      return cached?.dados ?? [];
    }
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}
