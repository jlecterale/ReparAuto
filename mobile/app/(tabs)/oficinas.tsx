import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SearchActionsRow } from '@/components/ui/SearchActionsRow';
import { SortSheet, type SortOption } from '@/components/ui/SortSheet';
import { OficinaFiltersSheet } from '@/components/oficinas/OficinaFiltersSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { OficinaCard } from '@/components/OficinaCard';
import { OficinasMapa } from '@/components/OficinasMapa';
import { useOficinas } from '@/hooks/useOficinas';
import { mapsDisponivel } from '@/lib/geo';
import { colors } from '@/theme/colors';

type Vista = 'lista' | 'mapa';
type Ordenar = 'relevancia' | 'avaliacao';

const SORT_OPCOES: SortOption<Ordenar>[] = [
  { value: 'relevancia', label: 'Mais recentes', icon: 'sparkles-outline' },
  { value: 'avaliacao', label: 'Melhor avaliadas', icon: 'star-outline' },
];

export default function OficinasScreen() {
  const { oficinas, loading, error } = useOficinas();
  const [busca, setBusca] = useState('');
  const [vista, setVista] = useState<Vista>('lista');

  const [distrito, setDistrito] = useState('');
  const [especialidade, setEspecialidade] = useState('');
  const [ordenar, setOrdenar] = useState<Ordenar>('relevancia');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const filtersCount = [distrito, especialidade].filter(Boolean).length;

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    let os = oficinas.filter((o) => {
      if (termo && !`${o.nome} ${o.localidade} ${o.distrito}`.toLowerCase().includes(termo)) return false;
      if (distrito && o.distrito !== distrito) return false;
      if (especialidade && !(o.especialidades ?? []).includes(especialidade as never)) return false;
      return true;
    });
    if (ordenar === 'avaliacao') {
      os = [...os].sort((a, b) => (b.mediaAvaliacoes ?? 0) - (a.mediaAvaliacoes ?? 0));
    }
    return os;
  }, [oficinas, busca, distrito, especialidade, ordenar]);

  function abrir(id: string) {
    router.push(`/oficinas/${id}`);
  }

  function limparFiltros() {
    setDistrito('');
    setEspecialidade('');
  }

  return (
    <Screen>
      <SectionHeader
        title="Oficinas"
        right={
          mapsDisponivel ? (
            <View className="flex-row rounded-full bg-neutral-100 p-1">
              <Toggle label="Lista" icon="list" ativo={vista === 'lista'} onPress={() => setVista('lista')} />
              <Toggle label="Mapa" icon="map" ativo={vista === 'mapa'} onPress={() => setVista('mapa')} />
            </View>
          ) : undefined
        }
      />

      {vista === 'lista' && (
        <View className="pb-1 pt-3">
          <SearchActionsRow
            value={busca}
            onChangeText={setBusca}
            placeholder="Procurar oficina ou localidade"
            filtersCount={filtersCount}
            onOpenFilters={() => setFiltersOpen(true)}
            sortActive={ordenar !== 'relevancia'}
            onOpenSort={() => setSortOpen(true)}
          />
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
      ) : mapsDisponivel && vista === 'mapa' ? (
        <OficinasMapa oficinas={filtradas} onSelect={abrir} />
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
              texto={busca || filtersCount > 0 ? 'Tente outros critérios.' : 'Ainda não há oficinas.'}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <OficinaFiltersSheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        distrito={distrito}
        setDistrito={setDistrito}
        especialidade={especialidade}
        setEspecialidade={setEspecialidade}
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
