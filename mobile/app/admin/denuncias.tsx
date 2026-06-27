import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, Text, View } from 'react-native';
import { Redirect, useFocusEffect } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { getAllReports, updateReportStatus } from '@/lib/admin';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { colors } from '@/theme/colors';
import { MOTIVO_REPORT_LABELS, type Report, type StatusReport } from '@/types';

const ALVO_LABEL: Record<Report['alvoTipo'], string> = {
  carro: 'Carro',
  peca: 'Peça',
  utilizador: 'Utilizador',
};

export default function AdminDenunciasScreen() {
  const { isAdmin, user } = useAuth();
  const { showToast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    const all = await getAllReports();
    setReports(all.filter((r) => r.status === 'pendente' || r.status === 'em_analise'));
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      carregar().finally(() => setLoading(false));
    }, [carregar]),
  );

  async function decidir(report: Report, status: StatusReport) {
    setPendingId(report.id);
    try {
      await updateReportStatus(report.id, status, user?.email ?? user?.uid ?? 'admin');
      if (status === 'em_analise') {
        setReports((atual) => atual.map((r) => (r.id === report.id ? { ...r, status } : r)));
      } else {
        setReports((atual) => atual.filter((r) => r.id !== report.id));
      }
      showToast('Denúncia atualizada.', 'success');
    } catch {
      showToast('Não foi possível atualizar a denúncia.', 'error');
    } finally {
      setPendingId(null);
    }
  }

  function confirmar(report: Report, status: 'resolvido' | 'rejeitado') {
    const verbo = status === 'resolvido' ? 'Resolver' : 'Rejeitar';
    Alert.alert(`${verbo} denúncia`, `${verbo} esta denúncia?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: verbo,
        style: status === 'rejeitado' ? 'destructive' : 'default',
        onPress: () => decidir(report, status),
      },
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
      data={reports}
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
              <Text className="text-base font-bold text-fg-heading">
                {MOTIVO_REPORT_LABELS[item.motivo]}
              </Text>
              <View
                className={`rounded px-2 py-0.5 ${
                  item.status === 'em_analise' ? 'bg-primary-100' : 'bg-warning-100'
                }`}
              >
                <Text
                  className={`text-[11px] font-bold ${
                    item.status === 'em_analise' ? 'text-primary-700' : 'text-warning-700'
                  }`}
                >
                  {item.status === 'em_analise' ? 'Em análise' : 'Pendente'}
                </Text>
              </View>
            </View>
            <Text className="mt-1 text-sm text-fg-muted">
              {ALVO_LABEL[item.alvoTipo]} · {item.alvoId.slice(0, 12)}
            </Text>
            <Text className="mt-1 text-sm text-fg-muted">De: {item.denuncianteEmail}</Text>
            {!!item.descricao && (
              <Text className="mt-2 text-sm text-fg">{item.descricao}</Text>
            )}
            <View className="mt-3 flex-row gap-3">
              {item.status === 'pendente' && (
                <View className="flex-1">
                  <Button
                    label="Em análise"
                    variant="outline"
                    disabled={busy}
                    onPress={() => decidir(item, 'em_analise')}
                  />
                </View>
              )}
              <View className="flex-1">
                <Button label="Resolver" loading={busy} onPress={() => confirmar(item, 'resolvido')} />
              </View>
              <View className="flex-1">
                <Button
                  label="Rejeitar"
                  variant="outline"
                  disabled={busy}
                  onPress={() => confirmar(item, 'rejeitado')}
                />
              </View>
            </View>
          </View>
        );
      }}
      ListEmptyComponent={
        <EmptyState
          icon="shield-checkmark-outline"
          titulo="Sem denúncias"
          texto="Não há denúncias por tratar."
        />
      }
    />
  );
}
