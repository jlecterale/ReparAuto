import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '@/components/ui/EmptyState';
import { OwnerStats } from '@/components/ui/OwnerStats';
import {
  deleteCarro,
  deleteOficina,
  deletePeca,
  getCarrosByCreator,
  getOficinasByCreator,
  getPecasByCreator,
} from '@/lib/db';
import { deleteIntencao, getIntencoesByUser } from '@/lib/trust';
import {
  clearAdDraft,
  loadAdDraft,
  type AdDraftKind,
  type CarDraftData,
  type IntentDraftData,
  type PartDraftData,
  type WorkshopDraftData,
} from '@/lib/draft';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme/colors';

type Kind = 'carro' | 'peca' | 'oficina' | 'intencao';
type EstadoItem = 'pendente' | 'aprovado' | 'rejeitado' | 'ativa' | 'rascunho' | 'outro';

interface ItemStats {
  visualizacoes?: number;
  contagemMensagens?: number;
  /** Cars only — parts have no favourite counter. */
  contagemFavoritos?: number;
}

interface Item {
  kind: Kind;
  id: string;
  titulo: string;
  subtitulo: string;
  status: EstadoItem;
  stats?: ItemStats;
  /** Local unpublished draft (lives on this device, not in Firestore). */
  draft?: boolean;
}

const STATUS: Record<EstadoItem, { label: string; bg: string; fg: string }> = {
  pendente: { label: 'Em revisão', bg: 'bg-warning-100', fg: 'text-warning-700' },
  aprovado: { label: 'Aprovado', bg: 'bg-success-100', fg: 'text-success-700' },
  ativa: { label: 'Ativa', bg: 'bg-success-100', fg: 'text-success-700' },
  rejeitado: { label: 'Rejeitado', bg: 'bg-danger-100', fg: 'text-danger-700' },
  rascunho: { label: 'Rascunho', bg: 'bg-primary-50', fg: 'text-primary-700' },
  outro: { label: '—', bg: 'bg-neutral-100', fg: 'text-fg-muted' },
};

function estado(s: string): EstadoItem {
  return (['pendente', 'aprovado', 'rejeitado', 'ativa'] as string[]).includes(s)
    ? (s as EstadoItem)
    : 'outro';
}

const KIND_ICON: Record<Kind, keyof typeof Ionicons.glyphMap> = {
  carro: 'car-sport',
  peca: 'construct',
  oficina: 'business',
  intencao: 'search',
};

export default function MeusAnunciosScreen() {
  const { user } = useAuth();
  const [itens, setItens] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const carregar = useCallback(async () => {
    if (!user?.email || !user?.uid) return;
    const [carros, pecas, oficinas, intencoes, carDraft, partDraft, workshopDraft, intentDraft] =
      await Promise.all([
        getCarrosByCreator(user.email),
        getPecasByCreator(user.email),
        getOficinasByCreator(user.email),
        getIntencoesByUser(user.uid),
        loadAdDraft<CarDraftData>('carro', user.uid),
        loadAdDraft<PartDraftData>('peca', user.uid),
        loadAdDraft<WorkshopDraftData>('oficina', user.uid),
        loadAdDraft<IntentDraftData>('intencao', user.uid),
      ]);
    const draftItem = (kind: Kind, titulo: string): Item => ({
      kind,
      id: 'draft',
      draft: true,
      titulo,
      subtitulo: 'Guardado neste dispositivo — toque para continuar',
      status: 'rascunho',
    });
    const lista: Item[] = [
      ...(carDraft
        ? [draftItem('carro', `${carDraft.data.marca} ${carDraft.data.modelo}`.trim() || 'Anúncio de carro')]
        : []),
      ...(partDraft ? [draftItem('peca', partDraft.data.titulo || 'Anúncio de peça')] : []),
      ...(workshopDraft ? [draftItem('oficina', workshopDraft.data.nome || 'Registo de oficina')] : []),
      ...(intentDraft ? [draftItem('intencao', intentDraft.data.titulo || 'Procura')] : []),
      ...carros.map((c) => ({
        kind: 'carro' as const,
        id: c.id,
        titulo: `${c.marca} ${c.modelo}`,
        subtitulo: `${c.anoFabricacao} · ${c.local}`,
        status: estado(c.status),
        stats: {
          visualizacoes: c.visualizacoes,
          contagemMensagens: c.contagemMensagens,
          contagemFavoritos: c.contagemFavoritos ?? 0,
        },
      })),
      ...pecas.map((p) => ({
        kind: 'peca' as const,
        id: p.id,
        titulo: p.titulo,
        subtitulo: `${p.categoria} · ${p.local}`,
        status: estado(p.status),
        stats: {
          visualizacoes: p.visualizacoes,
          contagemMensagens: p.contagemMensagens,
        },
      })),
      ...oficinas.map((o) => ({
        kind: 'oficina' as const,
        id: o.id,
        titulo: o.nome,
        subtitulo: [o.localidade, o.distrito].filter(Boolean).join(', '),
        status: estado(o.status),
      })),
      ...intencoes.map((i) => ({
        kind: 'intencao' as const,
        id: i.id,
        titulo: i.titulo,
        subtitulo: i.criterios?.localizacao?.distrito ?? 'Procura',
        status: estado(i.status),
      })),
    ];
    setItens(lista);
  }, [user?.email, user?.uid]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      carregar().finally(() => setLoading(false));
    }, [carregar]),
  );

  async function onRefresh() {
    setRefreshing(true);
    await carregar().catch(() => {});
    setRefreshing(false);
  }

  /** A draft has no detail page — opening it resumes the creation form. */
  function retomarRascunho(item: Item) {
    const retomar = { retomar: '1' };
    if (item.kind === 'carro') router.push({ pathname: '/anunciar/carro', params: retomar });
    else if (item.kind === 'peca') router.push({ pathname: '/anunciar/peca', params: retomar });
    else if (item.kind === 'oficina') router.push({ pathname: '/anunciar/oficina', params: retomar });
    else router.push({ pathname: '/anunciar/intencao', params: retomar });
  }

  function abrir(item: Item) {
    if (item.draft) retomarRascunho(item);
    else if (item.kind === 'carro') router.push(`/detalhes/${item.id}`);
    else if (item.kind === 'peca') router.push(`/pecas/${item.id}`);
    else if (item.kind === 'oficina') router.push(`/oficinas/${item.id}`);
    else router.push(`/intencoes/${item.id}`);
  }

  /** carro / peca / oficina have an edit form; intencao isn't editable here. */
  function editar(item: Item) {
    if (item.draft) retomarRascunho(item);
    else if (item.kind === 'carro') router.push({ pathname: '/anunciar/carro', params: { id: item.id } });
    else if (item.kind === 'peca') router.push({ pathname: '/anunciar/peca', params: { id: item.id } });
    else if (item.kind === 'oficina') router.push({ pathname: '/anunciar/oficina', params: { id: item.id } });
  }

  function confirmarRemover(item: Item) {
    if (item.draft) {
      Alert.alert('Descartar rascunho', `Descartar "${item.titulo}"?`, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Descartar',
          style: 'destructive',
          onPress: async () => {
            await clearAdDraft(item.kind as AdDraftKind);
            setItens((atual) => atual.filter((x) => !(x.draft && x.kind === item.kind)));
          },
        },
      ]);
      return;
    }
    Alert.alert('Eliminar anúncio', `Remover "${item.titulo}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          const remover = {
            carro: deleteCarro,
            peca: deletePeca,
            oficina: deleteOficina,
            intencao: deleteIntencao,
          }[item.kind];
          try {
            await remover(item.id);
            setItens((atual) => atual.filter((x) => !(x.id === item.id && x.kind === item.kind)));
          } catch {
            Alert.alert('Erro', 'Não foi possível eliminar.');
          }
        },
      },
    ]);
  }

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
      data={itens}
      keyExtractor={(item) => `${item.kind}_${item.id}`}
      contentContainerClassName="p-4"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => abrir(item)}
          className="mb-3 flex-row items-center rounded-2xl bg-white p-3 shadow-sm active:opacity-90"
        >
          <View className="h-11 w-11 items-center justify-center rounded-xl bg-primary-50">
            <Ionicons name={KIND_ICON[item.kind]} size={22} color={colors.primary[600]} />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-base font-bold text-fg-heading" numberOfLines={1}>
              {item.titulo}
            </Text>
            <Text className="text-sm text-fg-muted" numberOfLines={1}>
              {item.subtitulo}
            </Text>
            <View className={`mt-1 self-start rounded px-2 py-0.5 ${STATUS[item.status].bg}`}>
              <Text className={`text-[11px] font-bold ${STATUS[item.status].fg}`}>
                {STATUS[item.status].label}
              </Text>
            </View>
            {item.stats && (
              <View className="mt-1.5">
                <OwnerStats {...item.stats} />
              </View>
            )}
          </View>
          {(item.kind !== 'intencao' || item.draft) && (
            <Pressable
              onPress={() => editar(item)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Editar"
              className="p-2"
            >
              <Ionicons name="create-outline" size={20} color={colors.primary[600]} />
            </Pressable>
          )}
          <Pressable
            onPress={() => confirmarRemover(item)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Eliminar"
            className="p-2"
          >
            <Ionicons name="trash-outline" size={20} color={colors.danger[500]} />
          </Pressable>
        </Pressable>
      )}
      ListEmptyComponent={
        <EmptyState
          icon="file-tray-outline"
          titulo="Sem anúncios"
          texto="Os anúncios que publicar aparecem aqui."
        />
      }
    />
  );
}
