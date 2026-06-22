import { useCallback, useEffect, useMemo, useState } from 'react';
import { getMarcasModelos } from '@/lib/marcas';
import type { MarcaModeloDoc, TipoVeiculo } from '@/types';

interface UseMarcasModelosResult {
  /** Active brand names, alphabetically sorted, filtered by `tipo` if given. */
  marcas: string[];
  /** Models for a given brand (case-insensitive match). */
  getModelos: (marca: string) => string[];
  loading: boolean;
}

/**
 * Reads brands/models from the Firestore `marcas_modelos` collection (cached).
 * Used by the listing forms and filters so every brand/model the user sees
 * comes from the same source of truth as the web app.
 */
export function useMarcasModelos(tipo?: TipoVeiculo): UseMarcasModelosResult {
  const [docs, setDocs] = useState<MarcaModeloDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
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
  }, []);

  const marcas = useMemo(() => {
    return docs
      // A doc with no `tipos` array is treated as matching any tipo so it isn't
      // silently dropped from the picker.
      .filter((d) => d.ativo && (!tipo || !Array.isArray(d.tipos) || d.tipos.includes(tipo)))
      .map((d) => d.nome)
      .sort((a, b) => a.localeCompare(b));
  }, [docs, tipo]);

  const getModelos = useCallback(
    (marca: string): string[] => {
      const entry = docs.find((d) => d.nome.toLowerCase() === marca.toLowerCase());
      return entry?.modelos ?? [];
    },
    [docs],
  );

  return { marcas, getModelos, loading };
}
