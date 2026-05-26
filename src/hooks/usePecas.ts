import { useState, useEffect, useCallback } from 'react';
import { getPecas, addPeca, deletePeca } from '@/lib/db';
import type { Peca, FiltroTipoPeca } from '@/types/peca';

export default function usePecas() {
  const [pecas, setPecasState] = useState<Peca[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipoPeca>('todos');

  const carregar = useCallback(async () => {
    setLoading(true);
    const data = await getPecas();
    setPecasState(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const pecasFiltradas = useCallback(() => {
    let lista = [...pecas];

    if (filtroTipo !== 'todos') {
      lista = lista.filter((p) => p.tipo === filtroTipo);
    }

    return lista;
  }, [pecas, filtroTipo]);

  const publicarPeca = useCallback(
    async (dados: Record<string, unknown>) => {
      const nova = await addPeca(dados);
      await carregar();
      return nova;
    },
    [carregar]
  );

  const eliminarPeca = useCallback(
    async (id: string) => {
      await deletePeca(id);
      await carregar();
    },
    [carregar]
  );

  const getPecaPorId = useCallback(
    (id: string): Peca | null => pecas.find((p) => p.id === id) || null,
    [pecas]
  );

  return {
    pecas,
    pecasFiltradas: pecasFiltradas(),
    loading,
    filtroTipo,
    setFiltroTipo,
    publicarPeca,
    eliminarPeca,
    getPecaPorId,
    recarregar: carregar,
  };
}
