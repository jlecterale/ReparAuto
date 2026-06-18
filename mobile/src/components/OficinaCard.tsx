import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import type { Oficina } from '@/types';
import { ESPECIALIDADES_LABELS } from '@/types';
import { colors } from '@/theme/colors';

interface OficinaCardProps {
  oficina: Oficina;
  onPress: (id: string) => void;
}

function OficinaCardBase({ oficina, onPress }: OficinaCardProps) {
  const capa = oficina.logoUrl || oficina.fotos?.[0];
  return (
    <Pressable
      onPress={() => onPress(oficina.id)}
      accessibilityRole="button"
      className="mb-3 flex-row items-center overflow-hidden rounded-2xl bg-white p-3 shadow-sm active:opacity-90"
    >
      {capa ? (
        <Image
          source={capa}
          contentFit="cover"
          transition={200}
          style={{ width: 64, height: 64, borderRadius: 12 }}
        />
      ) : (
        <View className="h-16 w-16 items-center justify-center rounded-xl bg-primary-50">
          <Ionicons name="business" size={28} color={colors.primary[600]} />
        </View>
      )}

      <View className="ml-3 flex-1">
        <Text className="text-base font-bold text-fg-heading" numberOfLines={1}>
          {oficina.nome}
        </Text>
        <Text className="text-sm text-fg-muted" numberOfLines={1}>
          {oficina.especialidades
            ?.slice(0, 2)
            .map((e) => ESPECIALIDADES_LABELS[e])
            .join(' · ')}
        </Text>
        <View className="mt-1 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Ionicons name="location-outline" size={13} color={colors.fg.subtle} />
            <Text className="ml-0.5 text-xs text-fg-subtle" numberOfLines={1}>
              {[oficina.localidade, oficina.distrito].filter(Boolean).join(', ')}
            </Text>
          </View>
          {!!oficina.totalAvaliacoes && oficina.totalAvaliacoes > 0 && (
            <View className="flex-row items-center">
              <Ionicons name="star" size={13} color={colors.warning[500]} />
              <Text className="ml-0.5 text-xs font-semibold text-fg-muted">
                {oficina.mediaAvaliacoes?.toFixed(1)} ({oficina.totalAvaliacoes})
              </Text>
            </View>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.neutral[400]} />
    </Pressable>
  );
}

export const OficinaCard = memo(OficinaCardBase);
