import { useState, useEffect, useCallback } from 'react';
import { subscribePecas, addPeca, deletePeca } from '@/lib/db';
import { getDistritoForConcelho, getCoordenadas, haversineKm } from '@/lib/geo';
import type { Peca, FiltroTipoPeca } from '@/types/peca';

export default function usePecas() {
  const [pecas, setPecasState] = useState<Peca[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipoPeca>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [advDistrito, setAdvDistrito] = useState('');
  const [advConcelho, setAdvConcelho] = useState('');
  const [advRaioCentro, setAdvRaioCentro] = useState('');
  const [advRaioKm, setAdvRaioKm] = useState<number | null>(null);

  useEffect(() => {
    const unsub = subscribePecas(
      (data) => {
        setPecasState(data);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, []);

  const pecasFiltradas = useCallback(() => {
    let lista = [...pecas];

    if (filtroTipo !== 'todos') {
      lista = lista.filter((p) => p.tipo === filtroTipo);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      lista = lista.filter(
        (p) =>
          p.titulo.toLowerCase().includes(term) ||
          p.descricao.toLowerCase().includes(term) ||
          p.marcaCarro.toLowerCase().includes(term) ||
          (p.modeloCarro?.toLowerCase().includes(term) ?? false) ||
          p.categoria.toLowerCase().includes(term)
      );
    }

    if (filtroCategoria) {
      lista = lista.filter((p) => p.categoria === filtroCategoria);
    }

    if (filtroEstado) {
      lista = lista.filter((p) => p.estado === filtroEstado);
    }

    if (advRaioCentro && advRaioKm !== null && advRaioKm > 0) {
      const centro = getCoordenadas(advRaioCentro);
      if (centro) {
        lista = lista.filter((p) => {
          const coords = p.coordenadas ?? getCoordenadas(p.local);
          if (!coords) return false;
          return haversineKm(centro, coords) <= advRaioKm!;
        });
      }
    } else if (advConcelho) {
      lista = lista.filter((p) => p.local?.toLowerCase() === advConcelho.toLowerCase());
    } else if (advDistrito) {
      lista = lista.filter(
        (p) => (p.distrito ?? getDistritoForConcelho(p.local)) === advDistrito
      );
    }

    return lista;
  }, [pecas, filtroTipo, searchTerm, filtroCategoria, filtroEstado, advDistrito, advConcelho, advRaioCentro, advRaioKm]);

  const publicarPeca = useCallback(
    async (dados: Record<string, unknown>) => {
      const nova = await addPeca(dados);
      return nova;
    },
    []
  );

  const eliminarPeca = useCallback(
    async (id: string) => {
      await deletePeca(id);
    },
    []
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
    searchTerm,
    setSearchTerm,
    filtroCategoria,
    setFiltroCategoria,
    filtroEstado,
    setFiltroEstado,
    advDistrito,
    setAdvDistrito,
    advConcelho,
    setAdvConcelho,
    advRaioCentro,
    setAdvRaioCentro,
    advRaioKm,
    setAdvRaioKm,
    publicarPeca,
    eliminarPeca,
    getPecaPorId,
    recarregar: async () => {},
  };
}
