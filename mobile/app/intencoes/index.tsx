import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '@/components/ui/EmptyState';
import { IntencaoCard } from '@/components/IntencaoCard';
import { subscribeIntencoesAtivas } from '@/lib/trust';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import type { IntencaoCompra } from '@/types';
import { colors } from '@/theme/colors';

export default function IntencoesScreen() {
  const requireAuth = useRequireAuth();
  const [intencoes, setIntencoes] = useState<IntencaoCompra[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeIntencoesAtivas(
      (data) => {
        setIntencoes(data);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, []);

  return (
    <View className="flex-1 bg-neutral-50">
      <Stack.Screen
        options={{
          title: 'Procuras',
          headerRight: () => (
            <Pressable
              onPress={() => requireAuth(() => router.push('/anunciar/intencao'))}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Nova procura"
            >
              <Ionicons name="add" size={26} color={colors.primary[700]} />
            </Pressable>
          ),
        }}
      />
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary[600]} />
        </View>
      ) : (
        <FlatList
          data={intencoes}
          keyExtractor={(item) => item.id}
          contentContainerClassName="p-4"
          renderItem={({ item }) => (
            <IntencaoCard intencao={item} onPress={(id) => router.push(`/intencoes/${id}`)} />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              titulo="Sem procuras"
              texto="Quem procura um carro publica aqui o que pretende."
            />
          }
        />
      )}
    </View>
  );
}
