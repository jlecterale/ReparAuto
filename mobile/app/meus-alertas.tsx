import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useAlertSubscriptions } from '@/hooks/useAlertSubscriptions';
import { getPreferenciasNotificacao, atualizarPreferenciasNotificacao } from '@/lib/alerts';
import { colors } from '@/theme/colors';
import type { AlertSubscription, GrupoPreferencia, NotificationPreferences } from '@/types';

const CATEGORIA_LABELS: Record<string, string> = {
  carros: 'Carros',
  pecas: 'Peças',
  oficinas: 'Oficinas',
};

/** One-line human summary of what a subscription watches. */
function describeSubscription(sub: AlertSubscription): string {
  if (sub.tipo === 'palavra_chave') {
    const scope = sub.categoria ? ` em ${CATEGORIA_LABELS[sub.categoria]}` : '';
    return `Palavra-chave "${sub.keyword}"${scope}`;
  }
  if (sub.tipo === 'criterio') {
    const parts = [
      CATEGORIA_LABELS[sub.criteria.categoria],
      sub.criteria.tipoAnuncio,
      sub.criteria.marca,
      sub.criteria.concelho || sub.criteria.distrito,
    ].filter(Boolean);
    return `Novos anúncios: ${parts.join(' · ')}`;
  }
  const total = Object.keys(sub.filters).length;
  return `Filtro guardado (${total} ${total === 1 ? 'critério' : 'critérios'})`;
}

function subscriptionIcon(sub: AlertSubscription): keyof typeof Ionicons.glyphMap {
  if (sub.tipo === 'palavra_chave') return 'search';
  if (sub.tipo === 'criterio') return 'funnel';
  return 'bookmark';
}

function PreferenceRow({
  label,
  grupo,
  prefs,
  onToggle,
}: {
  label: string;
  grupo: GrupoPreferencia;
  prefs: NotificationPreferences;
  onToggle: (grupo: GrupoPreferencia, channel: 'inApp' | 'push') => void;
}) {
  return (
    <View className="mb-2 rounded-xl bg-neutral-50 p-3">
      <Text className="mb-2 text-sm font-semibold text-fg-heading">{label}</Text>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Text className="text-xs text-fg-muted">Na app</Text>
          <Switch
            value={prefs[grupo].inApp}
            onValueChange={() => onToggle(grupo, 'inApp')}
            trackColor={{ false: colors.neutral[200], true: colors.primary[300] }}
            thumbColor={prefs[grupo].inApp ? colors.primary[600] : colors.neutral[50]}
            ios_backgroundColor={colors.neutral[200]}
          />
        </View>
        <View className="flex-row items-center gap-2">
          <Text className="text-xs text-fg-muted">Push</Text>
          <Switch
            value={prefs[grupo].push}
            onValueChange={() => onToggle(grupo, 'push')}
            trackColor={{ false: colors.neutral[200], true: colors.primary[300] }}
            thumbColor={prefs[grupo].push ? colors.primary[600] : colors.neutral[50]}
            ios_backgroundColor={colors.neutral[200]}
          />
        </View>
      </View>
    </View>
  );
}

export default function MeusAlertasScreen() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { alertas, loading, atualizar, remover } = useAlertSubscriptions(user?.uid);
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    getPreferenciasNotificacao(user.uid).then(setPrefs).catch(() => {});
  }, [user?.uid]);

  async function togglePreferencia(grupo: GrupoPreferencia, channel: 'inApp' | 'push') {
    if (!user?.uid || !prefs) return;
    const next: NotificationPreferences = {
      ...prefs,
      [grupo]: { ...prefs[grupo], [channel]: !prefs[grupo][channel] },
    };
    setPrefs(next);
    try {
      await atualizarPreferenciasNotificacao(user.uid, next);
    } catch {
      setPrefs(prefs);
      showToast('Não foi possível guardar as preferências.', 'error');
    }
  }

  function toggleAtivo(sub: AlertSubscription) {
    atualizar(sub.id, { ativo: !sub.ativo }).catch(() => {
      showToast('Não foi possível atualizar o alerta.', 'error');
    });
  }

  function confirmarRemover(sub: AlertSubscription) {
    Alert.alert('Remover alerta', `Remover "${sub.nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            await remover(sub.id);
          } catch {
            showToast('Não foi possível remover o alerta.', 'error');
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
      data={alertas}
      keyExtractor={(item) => item.id}
      contentContainerClassName="p-4"
      ListHeaderComponent={
        prefs ? (
          <View className="mb-4">
            <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-fg-subtle">
              Preferências de notificação
            </Text>
            <PreferenceRow label="Os meus alertas" grupo="alerta" prefs={prefs} onToggle={togglePreferencia} />
            <PreferenceRow label="Quedas de preço" grupo="preco" prefs={prefs} onToggle={togglePreferencia} />
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <View
          className={`mb-3 flex-row items-center rounded-2xl bg-white p-3 shadow-sm ${
            item.ativo ? '' : 'opacity-60'
          }`}
        >
          <View className="h-11 w-11 items-center justify-center rounded-xl bg-primary-50">
            <Ionicons name={subscriptionIcon(item)} size={20} color={colors.primary[600]} />
          </View>
          <View className="ml-3 flex-1">
            <View className="flex-row items-center gap-2">
              <Text className="flex-1 text-base font-bold text-fg-heading" numberOfLines={1}>
                {item.nome}
              </Text>
              {item.novosResultados > 0 && (
                <View className="rounded-full bg-accent px-2 py-0.5">
                  <Text className="text-xs font-bold text-white">{item.novosResultados}</Text>
                </View>
              )}
            </View>
            <Text className="text-sm text-fg-muted" numberOfLines={1}>
              {describeSubscription(item)}
            </Text>
          </View>
          <Pressable
            onPress={() => toggleAtivo(item)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={item.ativo ? 'Pausar alerta' : 'Reativar alerta'}
            className="p-2"
          >
            <Ionicons
              name={item.ativo ? 'notifications' : 'notifications-off-outline'}
              size={20}
              color={colors.primary[600]}
            />
          </Pressable>
          <Pressable
            onPress={() => confirmarRemover(item)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Remover"
            className="p-2"
          >
            <Ionicons name="trash-outline" size={20} color={colors.danger[500]} />
          </Pressable>
        </View>
      )}
      ListEmptyComponent={
        <EmptyState
          icon="notifications-outline"
          titulo="Sem alertas"
          texto="Crie um alerta a partir dos filtros de busca e avisamos quando surgirem anúncios do seu interesse."
        />
      }
    />
  );
}
