import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { FilterChips, type ChipOption } from '@/components/ui/FilterChips';
import { EmptyState } from '@/components/ui/EmptyState';
import { PecaCard } from '@/components/PecaCard';
import { usePecas } from '@/hooks/usePecas';
import type { FiltroTipoPeca } from '@/types';
import { colors } from '@/theme/colors';

const FILTROS: ChipOption<FiltroTipoPeca>[] = [
  { value: 'todos', label: 'Todas' },
  { value: 'venda', label: 'Venda' },
  { value: 'desmonte', label: 'Desmonte' },
  { value: 'procura', label: 'Procura' },
];

export default function PecasScreen() {
  const { pecas, loading, error } = usePecas();
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<FiltroTipoPeca>('todos');

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return pecas.filter((p) => {
      if (filtro !== 'todos' && p.tipo !== filtro) return false;
      if (!termo) return true;
      return `${p.titulo} ${p.categoria} ${p.marcaCarro} ${p.local}`
        .toLowerCase()
        .includes(termo);
    });
  }, [pecas, busca, filtro]);

  return (
    <Screen>
      <SectionHeader title="Peças" />
      <View className="px-4 pt-3">
        <SearchBar
          value={busca}
          onChangeText={setBusca}
          placeholder="Procurar peça, categoria ou marca"
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
              texto={busca || filtro !== 'todos' ? 'Tente outros critérios.' : 'Ainda não há peças.'}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}
