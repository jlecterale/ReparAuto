import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, Text, View } from 'react-native';
import { Redirect, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { decidirVerificacao, getAllVerifications } from '@/lib/admin';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { colors } from '@/theme/colors';
import { TIPO_DOCUMENTO_LABELS, type Verification } from '@/types';

export default function AdminVerificacoesScreen() {
  const { isAdmin, user } = useAuth();
  const { showToast } = useToast();
  const [verificacoes, setVerificacoes] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    const all = await getAllVerifications();
    setVerificacoes(all.filter((v) => v.status === 'pendente'));
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      carregar().finally(() => setLoading(false));
    }, [carregar]),
  );

  async function decidir(v: Verification, status: 'aprovado' | 'rejeitado') {
    setPendingId(v.id);
    try {
      await decidirVerificacao(v, status, user?.email ?? user?.uid ?? 'admin');
      setVerificacoes((atual) => atual.filter((x) => x.id !== v.id));
      showToast(status === 'aprovado' ? 'Verificação aprovada.' : 'Verificação recusada.', 'success');
    } catch {
      showToast('Não foi possível concluir a ação.', 'error');
    } finally {
      setPendingId(null);
    }
  }

  function confirmarRejeitar(v: Verification) {
    Alert.alert('Recusar verificação', `Recusar o pedido de ${v.nome}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Recusar', style: 'destructive', onPress: () => decidir(v, 'rejeitado') },
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
      data={verificacoes}
      keyExtractor={(item) => item.id}
      contentContainerClassName="p-4"
      refreshControl={
        <RefreshControl refreshing={false} onRefresh={() => carregar().catch(() => {})} />
      }
      renderItem={({ item }) => {
        const busy = pendingId === item.id;
        return (
          <View className="mb-3 rounded-2xl bg-white p-4 shadow-sm">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-bold text-fg-heading">{item.nome}</Text>
              <View className="flex-row items-center rounded-full bg-primary-50 px-3 py-1">
                <Ionicons
                  name={item.tipo === 'profissional' ? 'briefcase-outline' : 'person-outline'}
                  size={13}
                  color={colors.primary[600]}
                />
                <Text className="ml-1 text-xs font-bold text-primary-700">
                  {item.tipo === 'profissional' ? 'Profissional' : 'Identidade'}
                </Text>
              </View>
            </View>
            <Text className="mt-1 text-sm text-fg-muted">{item.email}</Text>
            {!!item.nif && <Text className="text-sm text-fg-muted">NIF: {item.nif}</Text>}
            <Text className="mt-1 text-sm text-fg-muted">
              Documento: {TIPO_DOCUMENTO_LABELS[item.tipoDocumento]}
            </Text>

            {item.documentoUrl || item.selfieUrl ? (
              <View className="mt-3 flex-row gap-3">
                {!!item.documentoUrl && (
                  <Image
                    source={item.documentoUrl}
                    style={{ flex: 1, height: 120, borderRadius: 12 }}
                    contentFit="cover"
                  />
                )}
                {!!item.selfieUrl && (
                  <Image
                    source={item.selfieUrl}
                    style={{ flex: 1, height: 120, borderRadius: 12 }}
                    contentFit="cover"
                  />
                )}
              </View>
            ) : (
              <Text className="mt-3 text-xs italic text-fg-subtle">
                Documentos indisponíveis.
              </Text>
            )}

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
                  label="Recusar"
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
          icon="shield-checkmark-outline"
          titulo="Sem verificações"
          texto="Não há pedidos de verificação pendentes."
        />
      }
    />
  );
}
