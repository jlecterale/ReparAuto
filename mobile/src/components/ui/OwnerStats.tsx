import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatNumero } from '@/lib/format';
import { colors } from '@/theme/colors';

interface OwnerStatsProps {
  visualizacoes?: number;
  contagemMensagens?: number;
  /** Omit for parts — they have no favourite counter. */
  contagemFavoritos?: number;
  /** `compact` for listing cards, `card` for the detail screen panel. */
  variant?: 'compact' | 'card';
}

type StatDef = { icon: keyof typeof Ionicons.glyphMap; label: string; value: number };

/**
 * Owner-only view/message/favourite counters. Mirrors the web profile badges
 * (`Eye` / `ChatCircle` / `Heart`). Only render this for the listing owner.
 */
export function OwnerStats({
  visualizacoes,
  contagemMensagens,
  contagemFavoritos,
  variant = 'compact',
}: OwnerStatsProps) {
  const stats: StatDef[] = [
    { icon: 'eye-outline', label: 'Visualizações', value: visualizacoes ?? 0 },
    { icon: 'chatbubble-ellipses-outline', label: 'Mensagens', value: contagemMensagens ?? 0 },
  ];
  if (contagemFavoritos !== undefined) {
    stats.push({ icon: 'heart-outline', label: 'Favoritos', value: contagemFavoritos });
  }

  if (variant === 'card') {
    return (
      <View className="flex-row rounded-xl border border-neutral-200 bg-white">
        {stats.map((s, i) => (
          <View
            key={s.label}
            className={`flex-1 items-center py-3 ${i > 0 ? 'border-l border-neutral-200' : ''}`}
          >
            <Ionicons name={s.icon} size={20} color={colors.primary[600]} />
            <Text className="mt-1 text-lg font-extrabold text-fg-heading">
              {formatNumero(s.value)}
            </Text>
            <Text className="text-xs text-fg-subtle">{s.label}</Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View className="flex-row items-center gap-3">
      {stats.map((s) => (
        <View key={s.label} className="flex-row items-center">
          <Ionicons name={s.icon} size={13} color={colors.fg.subtle} />
          <Text className="ml-1 text-xs text-fg-subtle">{formatNumero(s.value)}</Text>
        </View>
      ))}
    </View>
  );
}
