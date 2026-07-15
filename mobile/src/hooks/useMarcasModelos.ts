import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getMarcasModelos } from '@/lib/marcas';
import { fetchFipeBrands, fetchFipeModels, type FipeBrand } from '@/lib/fipe';
import { useCountry } from '@/context/CountryContext';
import type { MarcaModeloDoc, TipoVeiculo } from '@/types';

interface UseMarcasModelosResult {
  /** Active brand names, alphabetically sorted, filtered by `tipo` if given. */
  marcas: string[];
  /** Models for a given brand (case-insensitive match). */
  getModelos: (marca: string) => string[];
  loading: boolean;
}

/**
 * Reads brands/models for the active market. Portugal uses the Firestore
 * `marcas_modelos` collection (cached), the same source of truth as the web
 * app; Brazil uses the official FIPE table (see `@/lib/fipe`), with models
 * loaded lazily per brand.
 */
export function useMarcasModelos(tipo?: TipoVeiculo): UseMarcasModelosResult {
  const { country } = useCountry();
  const [docs, setDocs] = useState<MarcaModeloDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (country !== 'PT') return;
    let cancelled = false;
    setLoading(true);
    getMarcasModelos()
      .then((d) => {
        if (!cancelled) setDocs(d);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
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
        if (!cancelled) setFipeBrands(brands);
      })
      .catch(() => {
        // Offline / rate-limited — the picker falls back to free-text input.
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
        .catch(() => {
          // Keep the marca in fipePending: getModelos runs on every render, so
          // clearing it here would re-issue the request in a retry loop against
          // a rate-limited API. A failed brand retries only on remount.
        });
    },
    [fipeBrands, tipo],
  );

  const marcas = useMemo(() => {
    if (country === 'BR') {
      return fipeBrands.map((b) => b.nome).sort((a, b) => a.localeCompare(b, 'pt'));
    }
    return docs
      // A doc with no `tipos` array is treated as matching any tipo so it isn't
      // silently dropped from the picker.
      .filter((d) => d.ativo && (!tipo || !Array.isArray(d.tipos) || d.tipos.includes(tipo)))
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
    [country, fipeModelos, requestFipeModelos, docs],
  );

  return { marcas, getModelos, loading };
}
