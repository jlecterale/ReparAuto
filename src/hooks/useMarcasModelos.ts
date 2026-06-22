'use client';

import { useEffect, useMemo, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MARCAS_MODELOS_COLLECTION, MARCAS_MODELOS_DOC } from '@/lib/constants';
import dados from '@/data/marcas-modelos.json';

export interface MarcaModelos {
  marca: string;
  modelos: string[];
}

type DadosCache = Array<{ marca: string; modelos: string[] }>;

// Module-level cache — shared across all hook instances
let cachePromise: Promise<DadosCache> | null = null;
let cachedData: DadosCache | null = null;

async function fetchMarcasModelos(): Promise<DadosCache> {
  if (cachedData) return cachedData;
  if (cachePromise) return cachePromise;

  const LS_KEY = 'reparauto_marcas_modelos_cache';

  cachePromise = (async () => {
    try {
      const docRef = doc(db, MARCAS_MODELOS_COLLECTION, MARCAS_MODELOS_DOC);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const firestoreData = snap.data().dados as DadosCache;
        if (firestoreData?.length) {
          cachedData = firestoreData;
          try { localStorage.setItem(LS_KEY, JSON.stringify(firestoreData)); } catch { /* quota exceeded */ }
          return firestoreData;
        }
      }
    } catch { /* Firestore unavailable */ }

    // Fallback: try localStorage cache
    try {
      const ls = localStorage.getItem(LS_KEY);
      if (ls) {
        const parsed = JSON.parse(ls) as DadosCache;
        if (parsed?.length) {
          cachedData = parsed;
          return parsed;
        }
      }
    } catch { /* parse failed */ }

    // Final fallback: bundled JSON
    cachedData = dados as DadosCache;
    return cachedData;
  })();

  return cachePromise;
}

export function useMarcasModelos() {
  const [data, setData] = useState<DadosCache | null>(cachedData ?? null);

  useEffect(() => {
    if (data) return; // already loaded
    fetchMarcasModelos().then(setData).catch(() => {
      // Last-resort fallback
      setData(dados as DadosCache);
    });
  }, [data]);

  const marcas = useMemo(
    () => (data ?? []).map((d) => d.marca).sort((a, b) => a.localeCompare(b)),
    [data],
  );

  const getModelos = (marca: string): string[] => {
    if (!data) return [];
    const entry = data.find(
      (d) => d.marca.toLowerCase() === marca.toLowerCase(),
    );
    return entry?.modelos ?? [];
  };

  return { marcas, getModelos, loaded: data !== null };
}
