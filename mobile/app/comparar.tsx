import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCarros } from '@/hooks/useCarros';
import { useCompare } from '@/hooks/useCompare';
import { buildCompareRows } from '@/lib/compare';
import { LISTING_PHOTO_ASPECT } from '@/lib/constants';
import { colors } from '@/theme/colors';
import type { Carro } from '@/types';

const BLURHASH = 'L6PZfSjE.AyE_3t7t7R**0o#DgR4';

export default function CompararScreen() {
  const { carros } = useCarros();
  const { ids, toggle } = useCompare();

  const selecionados = ids
    .map((id) => carros.find((c) => c.id === id))
    .filter((c): c is Carro => Boolean(c));

  if (selecionados.length < 2) {
    return (
      <View className="flex-1 bg-neutral-50">
        <EmptyState
          icon="scale-outline"
          titulo="Comparação vazia"
          texto="Selecione pelo menos 2 veículos na lista para os comparar aqui."
        />
      </View>
    );
  }

  const rows = buildCompareRows(selecionados);

  return (
    <ScrollView className="flex-1 bg-neutral-50" contentContainerClassName="p-4 pb-10">
      {/* Header: one column per car */}
      <View className="flex-row gap-2">
        {selecionados.map((carro) => (
          <View key={carro.id} className="flex-1 overflow-hidden rounded-xl bg-white shadow-sm">
            <View className="relative">
              {carro.fotos?.[0] ? (
                <Image
                  source={carro.fotos[0]}
                  placeholder={{ blurhash: BLURHASH }}
                  contentFit="cover"
                  transition={200}
                  style={{ width: '100%', aspectRatio: LISTING_PHOTO_ASPECT }}
                />
              ) : (
                <View
                  className="w-full items-center justify-center bg-neutral-100"
                  style={{ aspectRatio: LISTING_PHOTO_ASPECT }}
                >
                  <Ionicons name="car-outline" size={28} color={colors.neutral[400]} />
                </View>
              )}
              <Pressable
                onPress={() => toggle(carro.id)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Remover ${carro.marca} ${carro.modelo} da comparação`}
                className="absolute right-1 top-1 h-7 w-7 items-center justify-center rounded-full bg-white/90"
              >
                <Ionicons name="close" size={16} color={colors.neutral[700]} />
              </Pressable>
            </View>
            <Pressable
              onPress={() => router.push(`/detalhes/${carro.id}`)}
              accessibilityRole="button"
              className="p-2 active:opacity-80"
            >
              <Text className="text-sm font-extrabold text-fg-heading" numberOfLines={2}>
                {carro.marca} {carro.modelo}
              </Text>
              <Text className="mt-0.5 text-[11px] font-bold text-accent">Ver anúncio</Text>
            </Pressable>
          </View>
        ))}
      </View>

      {/* Comparison rows */}
      <View className="mt-4 overflow-hidden rounded-xl bg-white shadow-sm">
        {rows.map((row, rowIndex) => (
          <View key={row.label} className={rowIndex > 0 ? 'border-t border-neutral-100' : ''}>
            <Text className="px-3 pt-2.5 text-[11px] font-bold uppercase tracking-wide text-fg-subtle">
              {row.label}
            </Text>
            <View className="flex-row gap-2 px-2 pb-2.5 pt-1">
              {row.values.map((value, i) => {
                const best = row.bestIndices.includes(i);
                return (
                  <View
                    key={`${row.label}-${selecionados[i].id}`}
                    className={`flex-1 rounded-lg px-1.5 py-1 ${best ? 'bg-success-50' : ''}`}
                  >
                    <Text
                      className={`text-sm ${best ? 'font-extrabold text-success-700' : 'text-fg'}`}
                    >
                      {value}
                      {best ? ' ✓' : ''}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </View>

      <Text className="mt-3 text-[11px] leading-4 text-fg-subtle">
        Os valores destacados a verde são os melhores da comparação (menor preço e quilometragem,
        ano e potência mais altos).
      </Text>
    </ScrollView>
  );
}
