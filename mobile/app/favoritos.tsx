import { useMemo } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { router } from 'expo-router';
import { EmptyState } from '@/components/ui/EmptyState';
import { CarCard } from '@/components/CarCard';
import { useCarros } from '@/hooks/useCarros';
import { useFavoritos } from '@/context/FavoritosContext';
import { colors } from '@/theme/colors';

export default function FavoritosScreen() {
  const { carros, loading } = useCarros();
  const { favoritos } = useFavoritos();

  const favoritados = useMemo(() => {
    const set = new Set(favoritos);
    return carros.filter((c) => set.has(c.id));
  }, [carros, favoritos]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-50">
        <ActivityIndicator size="large" color={colors.primary[600]} />
      </View>
    );
  }

  return (
    <FlatList
      className="flex-1 bg-neutral-50"
      data={favoritados}
      keyExtractor={(item) => item.id}
      contentContainerClassName="px-4 pb-6 pt-3"
      renderItem={({ item }) => (
        <CarCard carro={item} onPress={(id) => router.push(`/detalhes/${id}`)} />
      )}
      ListEmptyComponent={
        <EmptyState
          icon="heart-outline"
          titulo="Sem favoritos"
          texto="Toque no coração de um anúncio para o guardar aqui."
        />
      }
      showsVerticalScrollIndicator={false}
    />
  );
}
