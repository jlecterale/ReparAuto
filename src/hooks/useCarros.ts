import { useState, useEffect, useCallback } from 'react';
import { getCarros, addCarro, deleteCarro } from '@/lib/db';
import type { Carro } from '@/types/carro';
import type { FiltroAtivo, SortOrdem } from '@/types/carro';

export default function useCarros() {
  const [carros, setCarrosState] = useState<Carro[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroAtivo, setFiltroAtivo] = useState<FiltroAtivo>('lowcost');
  const [searchQuery, setSearchQuery] = useState('');
  const [advPriceMin, setAdvPriceMin] = useState<number | null>(null);
  const [advPriceMax, setAdvPriceMax] = useState<number | null>(null);
  const [advLocation, setAdvLocation] = useState('');
  const [sortOrdem, setSortOrdem] = useState<SortOrdem>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    const data = await getCarros();
    setCarrosState(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

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
    if (advLocation.trim()) {
      const loc = advLocation.toLowerCase().trim();
      cs = cs.filter((c) => c.local?.toLowerCase().includes(loc));
    }

    if (sortOrdem === 'crescente') {
      cs.sort((a, b) => a.preco - b.preco);
    } else if (sortOrdem === 'decrescente') {
      cs.sort((a, b) => b.preco - a.preco);
    }

    return cs;
  }, [carros, filtroAtivo, searchQuery, advPriceMin, advPriceMax, advLocation, sortOrdem]);

  const publicarCarro = useCallback(
    async (dados: Record<string, unknown>) => {
      const novo = await addCarro(dados);
      await carregar();
      return novo;
    },
    [carregar]
  );

  const eliminarCarro = useCallback(
    async (id: string) => {
      await deleteCarro(id);
      await carregar();
    },
    [carregar]
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
    advLocation,
    setAdvLocation,
    sortOrdem,
    setSortOrdem,
    publicarCarro,
    eliminarCarro,
    getCarroPorId,
    recarregar: carregar,
  };
}
