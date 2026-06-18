import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { OficinaCard } from '@/components/OficinaCard';
import { OficinasMapa } from '@/components/OficinasMapa';
import { useOficinas } from '@/hooks/useOficinas';
import { colors } from '@/theme/colors';

type Vista = 'lista' | 'mapa';

export default function OficinasScreen() {
  const { oficinas, loading, error } = useOficinas();
  const [busca, setBusca] = useState('');
  const [vista, setVista] = useState<Vista>('lista');

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return oficinas;
    return oficinas.filter((o) =>
      `${o.nome} ${o.localidade} ${o.distrito}`.toLowerCase().includes(termo),
    );
  }, [oficinas, busca]);

  function abrir(id: string) {
    router.push(`/oficinas/${id}`);
  }

  return (
    <Screen>
      <SectionHeader
        title="Oficinas"
        right={
          <View className="flex-row rounded-full bg-neutral-100 p-1">
            <Toggle label="Lista" icon="list" ativo={vista === 'lista'} onPress={() => setVista('lista')} />
            <Toggle label="Mapa" icon="map" ativo={vista === 'mapa'} onPress={() => setVista('mapa')} />
          </View>
        }
      />

      {vista === 'lista' && (
        <View className="px-4 pb-1 pt-3">
          <SearchBar value={busca} onChangeText={setBusca} placeholder="Procurar oficina ou localidade" />
        </View>
      )}

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
      ) : vista === 'mapa' ? (
        <OficinasMapa oficinas={oficinas} onSelect={abrir} />
      ) : (
        <FlatList
          data={filtradas}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-4 pb-6 pt-2"
          renderItem={({ item }) => <OficinaCard oficina={item} onPress={abrir} />}
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

function Toggle({
  label,
  icon,
  ativo,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  ativo: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: ativo }}
      className={`flex-row items-center rounded-full px-3 py-1 ${ativo ? 'bg-white' : ''}`}
    >
      <Ionicons name={icon} size={15} color={ativo ? colors.primary[600] : colors.fg.subtle} />
      <Text className={`ml-1 text-xs font-semibold ${ativo ? 'text-primary-700' : 'text-fg-subtle'}`}>
        {label}
      </Text>
    </Pressable>
  );
}
