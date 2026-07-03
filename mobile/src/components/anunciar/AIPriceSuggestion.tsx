import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAIPriceSuggestion } from '@/hooks/useAIPriceSuggestion';
import { formatPreco } from '@/lib/format';
import { colors } from '@/theme/colors';
import type { AIPriceSuggestionRequest } from '@/types';

interface AIPriceSuggestionProps {
  facts: AIPriceSuggestionRequest;
  /** True once marca/modelo/ano are filled — the server requires them. */
  ready: boolean;
  uid?: string;
  onUsePrice: (price: number) => void;
}

/**
 * Market-anchored AI price suggestion widget for the listing form: shows
 * min / recommended / max plus the model's reasoning, with a one-tap
 * "Usar este preço" action.
 */
export function AIPriceSuggestion({ facts, ready, uid, onUsePrice }: AIPriceSuggestionProps) {
  const { suggest, suggestion, loading, error, remaining } = useAIPriceSuggestion(uid);
  const exhausted = remaining === 0;
  const disabled = !ready || exhausted || loading;

  return (
    <View className="mt-2">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled, busy: loading }}
        disabled={disabled}
        onPress={() => suggest(facts)}
        className={`flex-row items-center justify-center gap-1.5 self-start rounded-full border border-primary-300 bg-white px-3.5 py-2 active:opacity-80 ${
          disabled ? 'opacity-50' : ''
        }`}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : (
          <Ionicons name="sparkles" size={14} color={colors.accent} />
        )}
        <Text className="text-sm font-bold text-primary-700">
          {loading ? 'A analisar o mercado…' : 'Sugerir preço com IA'}
        </Text>
      </Pressable>

      {exhausted && (
        <Text className="mt-1 text-xs text-warning-600">
          Limite semanal de gerações com IA atingido.
        </Text>
      )}
      {!!error && <Text className="mt-1 text-xs text-danger-600">{error}</Text>}

      {suggestion && (
        <View className="mt-3 rounded-xl border border-primary-200 bg-primary-50 p-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-sm font-bold text-fg-heading">Sugestão de preço</Text>
            <View className="rounded-full bg-primary-100 px-2.5 py-0.5">
              <Text className="text-xs font-semibold text-primary-700">Assistido por IA</Text>
            </View>
          </View>

          <View className="mb-3 flex-row gap-2">
            <PriceCell label="Mínimo" value={formatPreco(suggestion.priceMin)} />
            <PriceCell label="Recomendado" value={formatPreco(suggestion.priceRecommended)} highlight />
            <PriceCell label="Máximo" value={formatPreco(suggestion.priceMax)} />
          </View>

          {!!suggestion.reasoning && (
            <Text className="mb-2 text-xs leading-5 text-fg-muted">{suggestion.reasoning}</Text>
          )}
          <Text className="mb-3 text-xs text-fg-subtle">
            {suggestion.marketSampleSize > 0
              ? `Baseado em ${suggestion.marketSampleSize} anúncio${suggestion.marketSampleSize === 1 ? '' : 's'} comparáve${suggestion.marketSampleSize === 1 ? 'l' : 'is'} no RecarGarage.`
              : 'Sem anúncios comparáveis publicados — estimativa do modelo para o mercado português.'}
          </Text>

          <View className="flex-row items-center justify-between">
            <Pressable
              accessibilityRole="button"
              onPress={() => onUsePrice(suggestion.priceRecommended)}
              className="rounded-full bg-success-600 px-4 py-2 active:opacity-80"
            >
              <Text className="text-sm font-bold text-white">Usar este preço</Text>
            </Pressable>
            <Text className="ml-2 flex-1 text-right text-[10px] text-fg-subtle">
              Resultado gerado por IA — verifique antes de utilizar.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

function PriceCell({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View
      className={`flex-1 items-center rounded-lg bg-white px-1 py-2 ${
        highlight ? 'border-2 border-accent' : 'border border-primary-100'
      }`}
    >
      <Text className="text-[10px] uppercase text-fg-subtle">{label}</Text>
      <Text className={`text-sm font-bold ${highlight ? 'text-accent' : 'text-fg'}`}>{value}</Text>
    </View>
  );
}
