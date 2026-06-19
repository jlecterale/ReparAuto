import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SearchActionsRow } from '@/components/ui/SearchActionsRow';
import { FilterChips, type ChipOption } from '@/components/ui/FilterChips';
import { SortSheet, type SortOption } from '@/components/ui/SortSheet';
import { PecaFiltersSheet } from '@/components/pecas/PecaFiltersSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { PecaCard } from '@/components/PecaCard';
import { usePecas } from '@/hooks/usePecas';
import type { FiltroTipoPeca } from '@/types';
import { colors } from '@/theme/colors';

type Ordenar = 'relevancia' | 'preco_asc' | 'preco_desc';

const FILTROS: ChipOption<FiltroTipoPeca>[] = [
  { value: 'todos', label: 'Todas' },
  { value: 'venda', label: 'Venda' },
  { value: 'desmonte', label: 'Desmonte' },
  { value: 'procura', label: 'Procura' },
];

const SORT_OPCOES: SortOption<Ordenar>[] = [
  { value: 'relevancia', label: 'Mais recentes', icon: 'sparkles-outline' },
  { value: 'preco_asc', label: 'Preço: mais baixo', icon: 'trending-down-outline' },
  { value: 'preco_desc', label: 'Preço: mais alto', icon: 'trending-up-outline' },
];

export default function PecasScreen() {
  const { pecas, loading, error } = usePecas();
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<FiltroTipoPeca>('todos');

  const [categoria, setCategoria] = useState('');
  const [estado, setEstado] = useState('');
  const [distrito, setDistrito] = useState('');
  const [ordenar, setOrdenar] = useState<Ordenar>('relevancia');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const filtersCount = [categoria, estado, distrito].filter(Boolean).length;

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const dist = distrito.toLowerCase();

    let ps = pecas.filter((p) => {
      if (filtro !== 'todos' && p.tipo !== filtro) return false;
      if (termo && !`${p.titulo} ${p.categoria} ${p.marcaCarro} ${p.local}`.toLowerCase().includes(termo))
        return false;
      if (categoria && p.categoria !== categoria) return false;
      if (estado && p.estado !== estado) return false;
      if (dist) {
        const pd = (p.distrito ?? '').toLowerCase();
        if (pd !== dist && !(p.local ?? '').toLowerCase().includes(dist)) return false;
      }
      return true;
    });

    if (ordenar !== 'relevancia') {
      // Parts may have no price (procura) → push those to the end.
      ps = [...ps].sort((a, b) => {
        const pa = a.preco ?? (ordenar === 'preco_asc' ? Infinity : -Infinity);
        const pb = b.preco ?? (ordenar === 'preco_asc' ? Infinity : -Infinity);
        return ordenar === 'preco_asc' ? pa - pb : pb - pa;
      });
    }
    return ps;
  }, [pecas, busca, filtro, categoria, estado, distrito, ordenar]);

  function limparFiltros() {
    setCategoria('');
    setEstado('');
    setDistrito('');
  }

  return (
    <Screen>
      <SectionHeader title="Peças" />
      <View className="pt-3">
        <SearchActionsRow
          value={busca}
          onChangeText={setBusca}
          placeholder="Procurar peça, categoria ou marca"
          filtersCount={filtersCount}
          onOpenFilters={() => setFiltersOpen(true)}
          sortActive={ordenar !== 'relevancia'}
          onOpenSort={() => setSortOpen(true)}
        />
      </View>
      <FilterChips options={FILTROS} selected={filtro} onSelect={setFiltro} />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary[600]} />
        </View>
      ) : error ? (
        <EmptyState
          icon="cloud-offline-outline"
          titulo="Não foi possível carregar"
          texto="Verifique a sua ligação e tente novamente."
        />
      ) : (
        <FlatList
          data={filtradas}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-4 pb-6 pt-1"
          renderItem={({ item }) => (
            <PecaCard peca={item} onPress={(id) => router.push(`/pecas/${id}`)} />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="construct-outline"
              titulo="Sem peças"
              texto={
                busca || filtro !== 'todos' || filtersCount > 0
                  ? 'Tente outros critérios.'
                  : 'Ainda não há peças.'
              }
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <PecaFiltersSheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        categoria={categoria}
        setCategoria={setCategoria}
        estado={estado}
        setEstado={setEstado}
        distrito={distrito}
        setDistrito={setDistrito}
        onClear={limparFiltros}
        resultCount={filtradas.length}
      />
      <SortSheet
        visible={sortOpen}
        onClose={() => setSortOpen(false)}
        options={SORT_OPCOES}
        value={ordenar}
        onChange={setOrdenar}
      />
    </Screen>
  );
}
