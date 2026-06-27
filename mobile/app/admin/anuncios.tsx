import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, Text, View } from 'react-native';
import { Redirect, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  getPendingCarros,
  getPendingOficinas,
  getPendingPecas,
  notificarDono,
  updateCarroStatus,
  updateOficinaStatus,
  updatePecaStatus,
} from '@/lib/admin';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { colors } from '@/theme/colors';
import type { StatusAnuncio } from '@/types';

type Kind = 'carro' | 'peca' | 'oficina';

interface Item {
  kind: Kind;
  id: string;
  titulo: string;
  subtitulo: string;
  criadorUid?: string;
  criador?: string;
}

const KIND_META: Record<Kind, { icon: keyof typeof Ionicons.glyphMap; label: string; detalhe: string }> = {
  carro: { icon: 'car-sport', label: 'Carro', detalhe: '/detalhes/' },
  peca: { icon: 'construct', label: 'Peça', detalhe: '/pecas/' },
  oficina: { icon: 'business', label: 'Oficina', detalhe: '/oficinas/' },
};

const UPDATERS: Record<Kind, (id: string, status: StatusAnuncio) => Promise<void>> = {
  carro: updateCarroStatus,
  peca: updatePecaStatus,
  oficina: updateOficinaStatus,
};

export default function AdminAnunciosScreen() {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const [itens, setItens] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    const [carros, pecas, oficinas] = await Promise.all([
      getPendingCarros(),
      getPendingPecas(),
      getPendingOficinas(),
    ]);
    setItens([
      ...carros.map((c) => ({
        kind: 'carro' as const,
        id: c.id,
        titulo: `${c.marca} ${c.modelo}`,
        subtitulo: `${c.anoFabricacao} · ${c.local}`,
        criadorUid: c.criadorUid,
        criador: c.criador,
      })),
      ...pecas.map((p) => ({
        kind: 'peca' as const,
        id: p.id,
        titulo: p.titulo,
        subtitulo: `${p.categoria} · ${p.local}`,
        criadorUid: p.criadorUid,
        criador: p.criador,
      })),
      ...oficinas.map((o) => ({
        kind: 'oficina' as const,
        id: o.id,
        titulo: o.nome,
        subtitulo: [o.localidade, o.distrito].filter(Boolean).join(', '),
        criador: o.criador,
      })),
    ]);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      carregar().finally(() => setLoading(false));
    }, [carregar]),
  );

  async function decidir(item: Item, status: Extract<StatusAnuncio, 'aprovado' | 'rejeitado'>) {
    setPendingId(item.id);
    try {
      await UPDATERS[item.kind](item.id, status);
      const aprovado = status === 'aprovado';
      await notificarDono(
        item.criadorUid,
        item.criador,
        aprovado ? 'aprovado' : 'rejeitado',
        `Anúncio ${aprovado ? 'aprovado' : 'rejeitado'}`,
        `O seu anúncio "${item.titulo}" foi ${aprovado ? 'aprovado' : 'rejeitado'}.`,
        aprovado ? `${KIND_META[item.kind].detalhe}${item.id}` : undefined,
      );
      setItens((atual) => atual.filter((x) => !(x.id === item.id && x.kind === item.kind)));
      showToast(aprovado ? 'Anúncio aprovado.' : 'Anúncio rejeitado.', 'success');
    } catch {
      showToast('Não foi possível concluir a ação.', 'error');
    } finally {
      setPendingId(null);
    }
  }

  function confirmarRejeitar(item: Item) {
    Alert.alert('Rejeitar anúncio', `Rejeitar "${item.titulo}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Rejeitar', style: 'destructive', onPress: () => decidir(item, 'rejeitado') },
    ]);
  }

  if (!isAdmin) return <Redirect href="/" />;

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
      refreshControl={
        <RefreshControl refreshing={false} onRefresh={() => carregar().catch(() => {})} />
      }
      renderItem={({ item }) => {
        const meta = KIND_META[item.kind];
        const busy = pendingId === item.id;
        return (
          <View className="mb-3 rounded-2xl bg-white p-3 shadow-sm">
            <View className="flex-row items-center">
              <View className="h-11 w-11 items-center justify-center rounded-xl bg-primary-50">
                <Ionicons name={meta.icon} size={22} color={colors.primary[600]} />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-base font-bold text-fg-heading" numberOfLines={1}>
                  {item.titulo}
                </Text>
                <Text className="text-sm text-fg-muted" numberOfLines={1}>
                  {meta.label} · {item.subtitulo}
                </Text>
              </View>
            </View>
            <View className="mt-3 flex-row gap-3">
              <View className="flex-1">
                <Button
                  label="Aprovar"
                  loading={busy}
                  onPress={() => decidir(item, 'aprovado')}
                  icon={<Ionicons name="checkmark" size={18} color="#fff" />}
                />
              </View>
              <View className="flex-1">
                <Button
                  label="Rejeitar"
                  variant="outline"
                  disabled={busy}
                  onPress={() => confirmarRejeitar(item)}
                  icon={<Ionicons name="close" size={18} color={colors.danger[600]} />}
                />
              </View>
            </View>
          </View>
        );
      }}
      ListEmptyComponent={
        <EmptyState
          icon="checkmark-done-outline"
          titulo="Sem pendentes"
          texto="Todos os anúncios foram revistos."
        />
      }
    />
  );
}
