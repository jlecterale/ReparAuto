'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  addSavedSearch,
  deleteSavedSearch,
  getSavedSearches,
  updateSavedSearch,
} from '@/lib/db';
import type { SavedSearch, SavedSearchCriteria } from '@/types/preco';

export default function useSavedSearches(uid: string | null) {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!uid) {
      setSearches([]);
      return;
    }
    setLoading(true);
    try {
      const data = await getSavedSearches(uid);
      setSearches(data);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    reload();
  }, [reload]);

  const adicionar = useCallback(
    async (nome: string, criterios: SavedSearchCriteria, alertasAtivos = true) => {
      if (!uid) throw new Error('Utilizador não autenticado');
      await addSavedSearch({ uid, nome, criterios, alertasAtivos });
      await reload();
    },
    [uid, reload],
  );

  const eliminar = useCallback(
    async (id: string) => {
      await deleteSavedSearch(id);
      await reload();
    },
    [reload],
  );

  const alternarAlertas = useCallback(
    async (id: string, ativo: boolean) => {
      await updateSavedSearch(id, { alertasAtivos: ativo } as any);
      await reload();
    },
    [reload],
  );

  return { searches, loading, adicionar, eliminar, alternarAlertas, reload };
}
