import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { SearchActionsRow } from '@/components/ui/SearchActionsRow';
import { FilterChips, type ChipOption } from '@/components/ui/FilterChips';
import { SortSheet, type SortOption } from '@/components/ui/SortSheet';
import { CarFiltersSheet } from '@/components/home/CarFiltersSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { Logo } from '@/components/ui/Logo';
import { CarCard } from '@/components/CarCard';
import { useCarros } from '@/hooks/useCarros';
import { useCarFilters, type QuickChip, type Ordenar } from '@/hooks/useCarFilters';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useNotificacoes } from '@/context/NotificacoesContext';
import { colors } from '@/theme/colors';

const FILTROS: ChipOption<QuickChip>[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'ate1000', label: 'Até €1.000' },
  { value: 'ate5000', label: 'Até €5.000' },
  { value: 'reparar', label: 'Para reparar' },
];

const SORT_OPCOES: SortOption<Ordenar>[] = [
  { value: 'relevancia', label: 'Mais recentes', icon: 'sparkles-outline' },
  { value: 'preco_asc', label: 'Preço: mais baixo', icon: 'trending-down-outline' },
  { value: 'preco_desc', label: 'Preço: mais alto', icon: 'trending-up-outline' },
];

export default function HomeScreen() {
  const { carros, loading, error } = useCarros();
  const requireAuth = useRequireAuth();
  const { naoLidas } = useNotificacoes();
  const {
    busca,
    setBusca,
    chip,
    setChip,
    ordenar,
    setOrdenar,
    filters,
    update,
    limpar,
    filtersCount,
    filtrados,
    marcaOpts,
    modeloOpts,
  } = useCarFilters(carros);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  return (
    <Screen>
      <View className="flex-row items-center justify-between px-4 pb-3 pt-1">
        <Logo />
        <View className="flex-row items-center gap-1">
          <Pressable
            onPress={() => requireAuth(() => router.push('/favoritos'))}
            accessibilityRole="button"
            accessibilityLabel="Favoritos"
            hitSlop={6}
            className="h-9 w-9 items-center justify-center"
          >
            <Ionicons name="heart-outline" size={24} color={colors.primary[700]} />
          </Pressable>
          <Pressable
            onPress={() => requireAuth(() => router.push('/notificacoes'))}
            accessibilityRole="button"
            accessibilityLabel="Notificações"
            hitSlop={6}
            className="h-9 w-9 items-center justify-center"
          >
            <Ionicons name="notifications-outline" size={24} color={colors.primary[700]} />
            {naoLidas > 0 && (
              <View className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-danger-500" />
            )}
          </Pressable>
          <Pressable
            onPress={() => requireAuth(() => router.push('/anunciar'))}
            accessibilityRole="button"
            className="ml-1 flex-row items-center rounded-full bg-accent px-4 py-2 active:opacity-80"
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text className="ml-1 font-bold text-white">Anunciar</Text>
          </Pressable>
        </View>
      </View>

      <SearchActionsRow
        value={busca}
        onChangeText={setBusca}
        placeholder="Procurar marca, modelo ou localidade"
        filtersCount={filtersCount}
        onOpenFilters={() => setFiltersOpen(true)}
        sortActive={ordenar !== 'relevancia'}
        onOpenSort={() => setSortOpen(true)}
      />
      <FilterChips options={FILTROS} selected={chip} onSelect={setChip} />

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
          data={filtrados}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-4 pb-6 pt-1"
          renderItem={({ item }) => (
            <CarCard carro={item} onPress={(id) => router.push(`/detalhes/${id}`)} />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="car-outline"
              titulo="Sem resultados"
              texto={
                busca || chip !== 'todos' || filtersCount > 0
                  ? 'Tente outros critérios.'
                  : 'Ainda não há anúncios.'
              }
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <CarFiltersSheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        update={update}
        onClear={limpar}
        resultCount={filtrados.length}
        marcaOpts={marcaOpts}
        modeloOpts={modeloOpts}
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
