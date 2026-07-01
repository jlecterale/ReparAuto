'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import dados from '@/data/marcas-modelos.json';
import { MARCAS_MODELOS_COLLECTION } from '@/lib/constants';
import { fetchFipeBrands, fetchFipeModels, type FipeBrand } from '@/lib/fipe';
import { useCountry } from '@/providers/CountryProvider';
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
  return Date.now() - cache.timestamp < CACHE_TTL_MS;
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
  const { country } = useCountry();
  const [docs, setDocs] = useState<MarcaModeloDoc[]>(() => {
    // Try cache first
    const cached = getCache();
    if (cached && isCacheValid(cached)) {
      return cached.dados;
    }
    return [];
  });
  const [loading, setLoading] = useState(() => {
    const cached = getCache();
    return !(cached && isCacheValid(cached));
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchMarcas() {
      // Check cache again (in case it was set between render and effect)
      const cached = getCache();
      if (cached && isCacheValid(cached)) {
        if (!cancelled) {
          setDocs(cached.dados);
          setLoading(false);
        }
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

        if (!cancelled) {
          setDocs(result);
          setCache(result);
          setLoading(false);
        }
      } catch (err) {
        console.warn('[useMarcasModelos] Erro ao buscar do Firestore, usando fallback:', err);
        const fallback = getFallbackData();
        if (!cancelled) {
          setDocs(fallback);
          setCache(fallback);
          setLoading(false);
          setError(null); // Fallback is silent — user doesn't need to know
        }
      }
    }

    if (country === 'PT') fetchMarcas();

    return () => {
      cancelled = true;
    };
  }, [country]);

  // Brazilian market: brands come from the official FIPE table instead of the
  // European catalog. Models load lazily per brand (FIPE is one request per
  // brand) and land in a map that getModelos reads synchronously.
  const [fipeBrands, setFipeBrands] = useState<FipeBrand[]>([]);
  const [fipeModelos, setFipeModelos] = useState<Record<string, string[]>>({});
  const fipePending = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (country !== 'BR') return;
    let cancelled = false;
    setLoading(true);
    fetchFipeBrands(tipo)
      .then((brands) => {
        if (cancelled) return;
        setFipeBrands(brands);
        setError(null);
      })
      .catch((err) => {
        console.warn('[useMarcasModelos] Erro ao buscar marcas FIPE:', err);
        if (!cancelled) setError('Não foi possível carregar as marcas.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [country, tipo]);

  const requestFipeModelos = useCallback(
    (marca: string) => {
      const brand = fipeBrands.find((b) => b.nome.toLowerCase() === marca.toLowerCase());
      if (!brand || fipePending.current.has(marca)) return;
      fipePending.current.add(marca);
      fetchFipeModels(brand.codigo, tipo)
        .then((modelos) => {
          setFipeModelos((prev) => ({ ...prev, [marca]: modelos }));
        })
        .catch((err) => {
          // Keep the marca marked as pending so a failing (possibly
          // rate-limited) endpoint isn't re-hit on every render; a fresh
          // mount retries.
          console.warn('[useMarcasModelos] Erro ao buscar modelos FIPE:', err);
        });
    },
    [fipeBrands, tipo]
  );

  const marcas = useMemo(() => {
    if (country === 'BR') {
      return fipeBrands.map((b) => b.nome).sort((a, b) => a.localeCompare(b, 'pt'));
    }
    let filtered = docs;
    if (tipo) {
      filtered = docs.filter((d) => d.tipos.includes(tipo));
    }
    return filtered
      .filter((d) => d.ativo)
      .map((d) => d.nome)
      .sort((a, b) => a.localeCompare(b));
  }, [country, fipeBrands, docs, tipo]);

  const getModelos = useCallback(
    (marca: string): string[] => {
      if (country === 'BR') {
        const cached = fipeModelos[marca];
        if (cached) return cached;
        // Called during render — defer the fetch (and its setState) to a microtask.
        queueMicrotask(() => requestFipeModelos(marca));
        return [];
      }
      const entry = docs.find((d) => d.nome.toLowerCase() === marca.toLowerCase());
      return entry?.modelos ?? [];
    },
    [country, fipeModelos, requestFipeModelos, docs]
  );

  return { marcas, getModelos, loading, error, docs };
}
