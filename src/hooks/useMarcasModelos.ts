'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import dados from '@/data/marcas-modelos.json';
import { MARCAS_MODELOS_COLLECTION } from '@/lib/constants';
import type { MarcaModeloDoc, MarcasModelosCache, TipoVeiculo } from '@/types/marcas-modelos';

export interface MarcaModelos {
  marca: string;
  modelos: string[];
}

const CACHE_KEY = 'marcas_modelos_cache';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function getCache(): MarcasModelosCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MarcasModelosCache;
  } catch {
    return null;
  }
}

function setCache(dados: MarcaModeloDoc[]): void {
  try {
    const cache: MarcasModelosCache = { timestamp: Date.now(), dados };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage might be full or unavailable
  }
}

function isCacheValid(cache: MarcasModelosCache): boolean {
  // An empty cache is never usable: earlier versions persisted `[]` after a
  // transient empty read, which then pinned an empty brand list for the whole
  // TTL window. Treat it as absent so we re-fetch (and show the JSON fallback).
  return cache.dados.length > 0 && Date.now() - cache.timestamp < CACHE_TTL_MS;
}

function getFallbackData(): MarcaModeloDoc[] {
  return (dados as { marca: string; modelos: string[] }[]).map((d) => ({
    nome: d.marca,
    tipos: ['carro'] as TipoVeiculo[],
    modelos: d.modelos,
    ativo: true,
  }));
}

interface UseMarcasModelosOptions {
  /** Filtrar marcas por tipo de veículo */
  tipo?: TipoVeiculo;
}

interface UseMarcasModelosResult {
  marcas: string[];
  getModelos: (marca: string) => string[];
  loading: boolean;
  error: string | null;
  /** Lista completa de documentos (para admin UI) */
  docs: MarcaModeloDoc[];
}

export function useMarcasModelos(options?: UseMarcasModelosOptions): UseMarcasModelosResult {
  const { tipo } = options ?? {};
  const [docs, setDocs] = useState<MarcaModeloDoc[]>(() => {
    // Seed synchronously so the brand list is populated on the very first
    // paint (and during SSR): fresh cache if we have it, otherwise the
    // bundled JSON. The Firestore read below only *upgrades* this baseline,
    // so the dropdown never blocks on — or is emptied by — the network
    // (blocked by CSP/adblocker, offline, hanging, or an empty snapshot).
    const cached = getCache();
    if (cached && isCacheValid(cached)) return cached.dados;
    return getFallbackData();
  });
  // Always have data to show, so there's no loading gate and no stuck skeleton.
  const loading = false;
  const error = null;

  useEffect(() => {
    let cancelled = false;

    async function fetchMarcas() {
      // Check cache again (in case it was set between render and effect)
      const cached = getCache();
      if (cached && isCacheValid(cached)) {
        if (!cancelled) setDocs(cached.dados);
        return;
      }

      try {
        const q = query(
          collection(db, MARCAS_MODELOS_COLLECTION),
          where('ativo', '==', true),
          orderBy('nome')
        );
        const snapshot = await getDocs(q);
        const result: MarcaModeloDoc[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data() as MarcaModeloDoc;
          result.push({ ...data, nome: doc.id });
        });

        // Only replace the seeded fallback with a non-empty server result. An
        // empty snapshot (e.g. an offline persistentLocalCache read, which
        // resolves rather than throws) keeps the bundled JSON in place.
        if (!cancelled && result.length > 0) {
          setDocs(result);
          setCache(result);
        }
      } catch (err) {
        // Keep the seeded fallback — the user doesn't need to know.
        console.warn('[useMarcasModelos] Erro ao buscar do Firestore, usando fallback:', err);
      }
    }

    fetchMarcas();

    return () => {
      cancelled = true;
    };
  }, []);

  const marcas = useMemo(() => {
    let filtered = docs;
    if (tipo) {
      filtered = docs.filter((d) => d.tipos.includes(tipo));
    }
    return filtered
      .filter((d) => d.ativo)
      .map((d) => d.nome)
      .sort((a, b) => a.localeCompare(b));
  }, [docs, tipo]);

  const getModelos = useCallback(
    (marca: string): string[] => {
      const entry = docs.find((d) => d.nome.toLowerCase() === marca.toLowerCase());
      return entry?.modelos ?? [];
    },
    [docs]
  );

  return { marcas, getModelos, loading, error, docs };
}
