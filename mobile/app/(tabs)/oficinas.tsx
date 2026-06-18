import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { OficinaCard } from '@/components/OficinaCard';
import { useOficinas } from '@/hooks/useOficinas';
import { colors } from '@/theme/colors';

export default function OficinasScreen() {
  const { oficinas, loading, error } = useOficinas();
  const [busca, setBusca] = useState('');

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return oficinas;
    return oficinas.filter((o) =>
      `${o.nome} ${o.localidade} ${o.distrito}`.toLowerCase().includes(termo),
    );
  }, [oficinas, busca]);

  return (
    <Screen>
      <SectionHeader title="Oficinas" />
      <View className="px-4 pb-1 pt-3">
        <SearchBar
          value={busca}
          onChangeText={setBusca}
          placeholder="Procurar oficina ou localidade"
        />
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
          data={filtradas}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-4 pb-6 pt-2"
          renderItem={({ item }) => (
            <OficinaCard oficina={item} onPress={(id) => router.push(`/oficinas/${id}`)} />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="business-outline"
              titulo="Sem oficinas"
              texto={busca ? 'Tente outra pesquisa.' : 'Ainda não há oficinas.'}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}
