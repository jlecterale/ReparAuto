import { useState, useEffect, useCallback } from 'react';
import { subscribeCarros, addCarro, deleteCarro } from '@/lib/db';
import { getDistritoForConcelho, getCoordenadas, haversineKm } from '@/lib/geo';
import type { Carro } from '@/types/carro';
import type { FiltroAtivo, SortOrdem } from '@/types/carro';

export default function useCarros() {
  const [carros, setCarrosState] = useState<Carro[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroAtivo, setFiltroAtivo] = useState<FiltroAtivo>('qualquer');
  const [searchQuery, setSearchQuery] = useState('');
  const [advPriceMin, setAdvPriceMin] = useState<number | null>(null);
  const [advPriceMax, setAdvPriceMax] = useState<number | null>(null);
  const [advDistrito, setAdvDistrito] = useState('');
  const [advConcelho, setAdvConcelho] = useState('');
  const [advRaioCentro, setAdvRaioCentro] = useState('');
  const [advRaioKm, setAdvRaioKm] = useState<number | null>(null);
  const [sortOrdem, setSortOrdem] = useState<SortOrdem>(null);

  useEffect(() => {
    const unsub = subscribeCarros(
      (data) => {
        setCarrosState(data);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, []);

  const carrosFiltrados = useCallback(() => {
    let cs = [...carros];

    if (filtroAtivo === 'lowcost') {
      cs = cs.filter((c) => c.preco <= 2000);
    } else if (filtroAtivo === '500') {
      cs = cs.filter((c) => c.preco <= 500);
    } else if (filtroAtivo === '1000') {
      cs = cs.filter((c) => c.preco <= 1000);
    } else if (filtroAtivo === 'reparar') {
      cs = cs.filter((c) => c.estadoVeiculo === 'manutencao');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      cs = cs.filter(
        (c) =>
          c.marca?.toLowerCase().includes(q) ||
          c.modelo?.toLowerCase().includes(q) ||
          c.local?.toLowerCase().includes(q)
      );
    }

    if (advPriceMin !== null && !isNaN(advPriceMin)) {
      cs = cs.filter((c) => c.preco >= Number(advPriceMin));
    }
    if (advPriceMax !== null && !isNaN(advPriceMax)) {
      cs = cs.filter((c) => c.preco <= Number(advPriceMax));
    }

    if (advRaioCentro && advRaioKm !== null && advRaioKm > 0) {
      const centro = getCoordenadas(advRaioCentro);
      if (centro) {
        cs = cs.filter((c) => {
          const coords = c.coordenadas ?? getCoordenadas(c.local);
          if (!coords) return false;
          return haversineKm(centro, coords) <= advRaioKm!;
        });
      }
    } else if (advConcelho) {
      cs = cs.filter((c) => c.local?.toLowerCase() === advConcelho.toLowerCase());
    } else if (advDistrito) {
      cs = cs.filter(
        (c) => (c.distrito ?? getDistritoForConcelho(c.local)) === advDistrito
      );
    }

    if (sortOrdem === 'crescente') {
      cs.sort((a, b) => a.preco - b.preco);
    } else if (sortOrdem === 'decrescente') {
      cs.sort((a, b) => b.preco - a.preco);
    }

    return cs;
  }, [carros, filtroAtivo, searchQuery, advPriceMin, advPriceMax, advDistrito, advConcelho, advRaioCentro, advRaioKm, sortOrdem]);

  const publicarCarro = useCallback(
    async (dados: Record<string, unknown>) => {
      const novo = await addCarro(dados);
      return novo;
    },
    []
  );

  const eliminarCarro = useCallback(
    async (id: string) => {
      await deleteCarro(id);
    },
    []
  );

  const getCarroPorId = useCallback(
    (id: string): Carro | null => carros.find((c) => c.id === id) || null,
    [carros]
  );

  return {
    carros,
    carrosFiltrados: carrosFiltrados(),
    loading,
    filtroAtivo,
    setFiltroAtivo,
    searchQuery,
    setSearchQuery,
    advPriceMin,
    setAdvPriceMin,
    advPriceMax,
    setAdvPriceMax,
    advDistrito,
    setAdvDistrito,
    advConcelho,
    setAdvConcelho,
    advRaioCentro,
    setAdvRaioCentro,
    advRaioKm,
    setAdvRaioKm,
    sortOrdem,
    setSortOrdem,
    publicarCarro,
    eliminarCarro,
    getCarroPorId,
    recarregar: async () => {},
  };
}
