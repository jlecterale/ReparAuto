import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { SearchBar } from '@/components/ui/SearchBar';
import { FilterChips, type ChipOption } from '@/components/ui/FilterChips';
import { EmptyState } from '@/components/ui/EmptyState';
import { Logo } from '@/components/ui/Logo';
import { CarCard } from '@/components/CarCard';
import { useCarros } from '@/hooks/useCarros';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useNotificacoes } from '@/context/NotificacoesContext';
import type { Carro } from '@/types';
import { colors } from '@/theme/colors';

type Filtro = 'todos' | 'ate1000' | 'ate5000' | 'reparar';

const FILTROS: ChipOption<Filtro>[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'ate1000', label: 'Até €1.000' },
  { value: 'ate5000', label: 'Até €5.000' },
  { value: 'reparar', label: 'Para reparar' },
];

function aplicaFiltro(carro: Carro, filtro: Filtro): boolean {
  switch (filtro) {
    case 'ate1000':
      return carro.preco <= 1000;
    case 'ate5000':
      return carro.preco <= 5000;
    case 'reparar':
      return carro.estadoVeiculo === 'manutencao';
    default:
      return true;
  }
}

export default function HomeScreen() {
  const { carros, loading, error } = useCarros();
  const requireAuth = useRequireAuth();
  const { naoLidas } = useNotificacoes();
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return carros.filter((c) => {
      if (!aplicaFiltro(c, filtro)) return false;
      if (!termo) return true;
      return `${c.marca} ${c.modelo} ${c.local}`.toLowerCase().includes(termo);
    });
  }, [carros, busca, filtro]);

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

      <View className="px-4">
        <SearchBar
          value={busca}
          onChangeText={setBusca}
          placeholder="Procurar marca, modelo ou localidade"
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
              texto={busca || filtro !== 'todos' ? 'Tente outros critérios.' : 'Ainda não há anúncios.'}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}
