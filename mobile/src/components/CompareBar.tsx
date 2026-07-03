import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCompare } from '@/hooks/useCompare';
import { MAX_COMPARE } from '@/lib/compare';
import { colors } from '@/theme/colors';
import type { Carro } from '@/types';

interface CompareBarProps {
  carros: Carro[];
}

/**
 * Bar shown while the user picks vehicles to compare. Renders nothing until
 * at least one car is selected; sits in normal flow below the list so it
 * never covers content.
 */
export function CompareBar({ carros }: CompareBarProps) {
  const { ids, toggle, clear } = useCompare();

  const selecionados = ids
    .map((id) => carros.find((c) => c.id === id))
    .filter((c): c is Carro => Boolean(c));

  if (selecionados.length === 0) return null;

  const podeComparar = selecionados.length >= 2;

  return (
    <View className="border-t border-neutral-200 bg-white px-4 py-2.5">
      <View className="flex-row items-center">
        <Ionicons name="scale-outline" size={18} color={colors.primary[600]} />
        <Text className="ml-2 flex-1 text-sm font-bold text-fg-heading">
          Comparar ({selecionados.length}/{MAX_COMPARE})
        </Text>
        <Pressable
          onPress={clear}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Limpar comparação"
          className="mr-2 px-2 py-1"
        >
          <Text className="text-xs font-semibold text-fg-muted">Limpar</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/comparar')}
          disabled={!podeComparar}
          accessibilityRole="button"
          className={`rounded-full px-4 py-2 ${podeComparar ? 'bg-accent active:opacity-80' : 'bg-neutral-200'}`}
        >
          <Text className={`text-sm font-bold ${podeComparar ? 'text-white' : 'text-neutral-500'}`}>
            Comparar
          </Text>
        </Pressable>
      </View>
      <View className="mt-1.5 flex-row flex-wrap gap-1.5">
        {selecionados.map((carro) => (
          <Pressable
            key={carro.id}
            onPress={() => toggle(carro.id)}
            accessibilityRole="button"
            accessibilityLabel={`Remover ${carro.marca} ${carro.modelo} da comparação`}
            className="flex-row items-center rounded-full border border-neutral-200 bg-neutral-50 py-0.5 pl-2.5 pr-1.5"
          >
            <Text className="text-xs font-semibold text-fg" numberOfLines={1}>
              {carro.marca} {carro.modelo}
            </Text>
            <Ionicons name="close" size={13} color={colors.neutral[500]} style={{ marginLeft: 4 }} />
          </Pressable>
        ))}
      </View>
      {!podeComparar && (
        <Text className="mt-1 text-[11px] text-fg-subtle">
          Selecione pelo menos 2 veículos para comparar.
        </Text>
      )}
    </View>
  );
}
