import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import type { Carro } from '@/types';
import { formatKm, formatPreco } from '@/lib/format';
import { docCountry } from '@/lib/country';
import { FavoriteButton } from '@/components/ui/FavoriteButton';
import { colors } from '@/theme/colors';

const BLURHASH = 'L6PZfSjE.AyE_3t7t7R**0o#DgR4';

interface CarCardProps {
  carro: Carro;
  onPress: (id: string) => void;
}

function CarCardBase({ carro, onPress }: CarCardProps) {
  return (
    <Pressable
      onPress={() => onPress(carro.id)}
      accessibilityRole="button"
      className="mb-4 overflow-hidden rounded-2xl bg-white shadow-sm active:opacity-90"
    >
      <View className="relative">
        <Image
          source={carro.fotos?.[0]}
          placeholder={{ blurhash: BLURHASH }}
          contentFit="cover"
          transition={200}
          style={{ width: '100%', height: 200 }}
        />
        <View className="absolute bottom-2 right-2 rounded-lg bg-primary-900/90 px-3 py-1.5">
          <Text className="text-base font-extrabold text-white">
            {formatPreco(carro.preco, docCountry(carro))}
          </Text>
        </View>
        {carro.estadoVeiculo === 'manutencao' && (
          <View className="absolute left-2 top-2 rounded-md bg-warning-500 px-2 py-1">
            <Text className="text-xs font-bold text-neutral-900">Para reparar</Text>
          </View>
        )}
        <View className="absolute right-2 top-2">
          <FavoriteButton id={carro.id} floating />
        </View>
      </View>

      <View className="p-3">
        <Text className="text-base font-bold text-fg-heading" numberOfLines={1}>
          {carro.marca} {carro.modelo}
        </Text>
        <View className="mt-2 flex-row flex-wrap items-center gap-x-3 gap-y-1">
          <Meta icon="calendar-outline" text={String(carro.anoFabricacao)} />
          <Meta icon="speedometer-outline" text={formatKm(carro.km)} />
          <Meta icon="water-outline" text={carro.combustivel} />
        </View>
        {!!carro.local && (
          <View className="mt-2 flex-row items-center">
            <Ionicons name="location-outline" size={14} color={colors.fg.subtle} />
            <Text className="ml-1 text-sm text-fg-subtle" numberOfLines={1}>
              {carro.local}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function Meta({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  return (
    <View className="flex-row items-center">
      <Ionicons name={icon} size={14} color={colors.fg.muted} />
      <Text className="ml-1 text-sm text-fg-muted">{text}</Text>
    </View>
  );
}

export const CarCard = memo(CarCardBase);
