import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import type { Peca } from '@/types';
import { TIPO_PECA_LABELS } from '@/types';
import { formatPrecoOpcional } from '@/lib/format';
import { colors } from '@/theme/colors';

const BLURHASH = 'L6PZfSjE.AyE_3t7t7R**0o#DgR4';

const TIPO_STYLE: Record<Peca['tipo'], string> = {
  venda: 'bg-success-100 text-success-700',
  desmonte: 'bg-secondary-100 text-secondary-700',
  procura: 'bg-primary-100 text-primary-700',
};

interface PecaCardProps {
  peca: Peca;
  onPress: (id: string) => void;
}

function PecaCardBase({ peca, onPress }: PecaCardProps) {
  return (
    <Pressable
      onPress={() => onPress(peca.id)}
      accessibilityRole="button"
      className="mb-3 flex-row overflow-hidden rounded-2xl bg-white shadow-sm active:opacity-90"
    >
      {peca.foto ? (
        <Image
          source={peca.foto}
          placeholder={{ blurhash: BLURHASH }}
          contentFit="cover"
          transition={200}
          style={{ width: 110, height: 110 }}
        />
      ) : (
        <View className="h-[110px] w-[110px] items-center justify-center bg-neutral-100">
          <Ionicons name="cube-outline" size={32} color={colors.neutral[400]} />
        </View>
      )}

      <View className="flex-1 p-3">
        <View className={`self-start rounded px-2 py-0.5 ${TIPO_STYLE[peca.tipo].split(' ')[0]}`}>
          <Text className={`text-[11px] font-bold ${TIPO_STYLE[peca.tipo].split(' ')[1]}`}>
            {TIPO_PECA_LABELS[peca.tipo]}
          </Text>
        </View>
        <Text className="mt-1 text-base font-bold text-fg-heading" numberOfLines={1}>
          {peca.titulo}
        </Text>
        <Text className="text-sm text-fg-muted" numberOfLines={1}>
          {[peca.categoria, peca.marcaCarro].filter(Boolean).join(' · ')}
        </Text>
        <View className="mt-auto flex-row items-center justify-between pt-1">
          <Text className="text-base font-extrabold text-accent">
            {formatPrecoOpcional(peca.preco)}
          </Text>
          {!!peca.local && (
            <View className="flex-row items-center">
              <Ionicons name="location-outline" size={13} color={colors.fg.subtle} />
              <Text className="ml-0.5 text-xs text-fg-subtle" numberOfLines={1}>
                {peca.local}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export const PecaCard = memo(PecaCardBase);
