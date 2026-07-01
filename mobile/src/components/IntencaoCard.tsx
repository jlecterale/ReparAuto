import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { IntencaoCompra } from '@/types';
import { CATEGORIA_INTENCAO_LABELS } from '@/types';
import { formatPreco } from '@/lib/format';
import { colors } from '@/theme/colors';

interface IntencaoCardProps {
  intencao: IntencaoCompra;
  onPress: (id: string) => void;
}

function IntencaoCardBase({ intencao, onPress }: IntencaoCardProps) {
  const c = intencao.criterios;
  return (
    <Pressable
      onPress={() => onPress(intencao.id)}
      accessibilityRole="button"
      className="mb-3 rounded-2xl bg-white p-4 shadow-sm active:opacity-90"
    >
      <View className="flex-row items-center justify-between">
        <View className="self-start rounded bg-primary-100 px-2 py-0.5">
          <Text className="text-[11px] font-bold text-primary-700">
            {CATEGORIA_INTENCAO_LABELS[intencao.categoria]}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="search" size={13} color={colors.fg.subtle} />
          <Text className="ml-1 text-xs text-fg-subtle">Procura</Text>
        </View>
      </View>

      <Text className="mt-2 text-base font-bold text-fg-heading" numberOfLines={1}>
        {intencao.titulo}
      </Text>
      <Text className="text-sm text-fg-muted" numberOfLines={1}>
        {[c?.marca, c?.modelo].filter(Boolean).join(' ') || 'Qualquer modelo'}
      </Text>

      <View className="mt-2 flex-row flex-wrap items-center gap-x-3 gap-y-1">
        {!!c?.precoMaximo && (
          <Meta icon="cash-outline" text={`até ${formatPreco(c.precoMaximo)}`} />
        )}
        {!!c?.anoMinimo && <Meta icon="calendar-outline" text={`desde ${c.anoMinimo}`} />}
        {!!c?.localizacao?.distrito && (
          <Meta icon="location-outline" text={c.localizacao.distrito} />
        )}
      </View>
    </Pressable>
  );
}

function Meta({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View className="flex-row items-center">
      <Ionicons name={icon} size={13} color={colors.fg.muted} />
      <Text className="ml-1 text-sm text-fg-muted">{text}</Text>
    </View>
  );
}

export const IntencaoCard = memo(IntencaoCardBase);
