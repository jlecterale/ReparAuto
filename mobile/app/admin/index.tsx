import { useCallback } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Redirect, router, useFocusEffect, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useAdminPendencias } from '@/hooks/useAdminPendencias';
import { colors } from '@/theme/colors';

interface QueueRow {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  count: number;
  href: Href;
}

export default function AdminDashboard() {
  const { isAdmin } = useAuth();
  const { contagens, total, loading, refetch } = useAdminPendencias(isAdmin);

  useFocusEffect(
    useCallback(() => {
      refetch().catch(() => {});
    }, [refetch]),
  );

  if (!isAdmin) return <Redirect href="/" />;

  const queues: QueueRow[] = [
    { icon: 'car-sport-outline', label: 'Carros', count: contagens.carros, href: '/admin/anuncios' },
    { icon: 'construct-outline', label: 'Peças', count: contagens.pecas, href: '/admin/anuncios' },
    { icon: 'business-outline', label: 'Oficinas', count: contagens.oficinas, href: '/admin/anuncios' },
    { icon: 'flag-outline', label: 'Denúncias', count: contagens.denuncias, href: '/admin/denuncias' },
    { icon: 'shield-checkmark-outline', label: 'Verificações', count: contagens.verificacoes, href: '/admin/verificacoes' },
  ];

  return (
    <ScrollView
      className="flex-1 bg-neutral-50"
      contentContainerClassName="p-4"
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => refetch().catch(() => {})} />}
    >
      <View className="mb-4 flex-row items-center rounded-2xl bg-primary-600 p-5">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-white/20">
          <Ionicons name="shield-half-outline" size={26} color="#fff" />
        </View>
        <View className="ml-4 flex-1">
          <Text className="text-sm text-white/80">Pendências totais</Text>
          <Text className="text-3xl font-extrabold text-white">{loading ? '—' : total}</Text>
        </View>
      </View>

      <View className="overflow-hidden rounded-2xl bg-white">
        {queues.map((q, i) => (
          <Pressable
            key={q.label}
            onPress={() => router.push(q.href)}
            accessibilityRole="button"
            className={`flex-row items-center px-4 py-4 active:bg-neutral-50 ${
              i === queues.length - 1 ? '' : 'border-b border-neutral-100'
            }`}
          >
            <Ionicons name={q.icon} size={22} color={colors.primary[600]} />
            <Text className="ml-3 flex-1 text-base font-medium text-fg">{q.label}</Text>
            {q.count > 0 && (
              <View className="mr-2 min-w-[24px] items-center rounded-full bg-danger-500 px-2 py-0.5">
                <Text className="text-xs font-bold text-white">{q.count}</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={18} color={colors.neutral[400]} />
          </Pressable>
        ))}
      </View>

      {loading && (
        <View className="mt-6 items-center">
          <ActivityIndicator color={colors.primary[600]} />
        </View>
      )}
    </ScrollView>
  );
}
