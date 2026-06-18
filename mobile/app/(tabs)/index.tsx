import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/ui/Logo';
import { CarCard } from '@/components/CarCard';
import { useCarros } from '@/hooks/useCarros';
import { colors } from '@/theme/colors';

export default function HomeScreen() {
  const { carros, loading, error } = useCarros();
  const [busca, setBusca] = useState('');

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return carros;
    return carros.filter((c) =>
      `${c.marca} ${c.modelo} ${c.local}`.toLowerCase().includes(termo),
    );
  }, [carros, busca]);

  return (
    <Screen>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pb-3 pt-1">
        <Logo />
        <Pressable
          onPress={() => router.push('/anunciar')}
          className="flex-row items-center rounded-full bg-accent px-4 py-2 active:opacity-80"
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text className="ml-1 font-bold text-white">Anunciar</Text>
        </Pressable>
      </View>

      {/* Search */}
      <View className="px-4 pb-2">
        <View className="flex-row items-center rounded-xl border border-neutral-300 bg-white px-3">
          <Ionicons name="search" size={18} color={colors.fg.subtle} />
          <Input
            value={busca}
            onChangeText={setBusca}
            placeholder="Procurar marca, modelo ou localidade"
            className="flex-1 border-0 px-2"
          />
        </View>
      </View>

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
              texto={busca ? 'Tente outra pesquisa.' : 'Ainda não há anúncios.'}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}

function EmptyState({
  icon,
  titulo,
  texto,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  titulo: string;
  texto: string;
}) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-20">
      <Ionicons name={icon} size={56} color={colors.neutral[300]} />
      <Text className="mt-4 text-lg font-bold text-fg-heading">{titulo}</Text>
      <Text className="mt-1 text-center text-fg-muted">{texto}</Text>
    </View>
  );
}
