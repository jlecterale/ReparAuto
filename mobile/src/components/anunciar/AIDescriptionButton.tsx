import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAIDescription } from '@/hooks/useAIDescription';
import type { AIDescriptionRequest } from '@/types';

interface AIDescriptionButtonProps {
  facts: AIDescriptionRequest;
  /** True once marca/modelo/ano are filled — the server requires them. */
  ready: boolean;
  uid?: string;
  onGenerated: (description: string) => void;
}

/**
 * "Gerar com IA" action for the description field. Calls the Cloud Function
 * proxy and hands the sanitized text back to the form.
 */
export function AIDescriptionButton({ facts, ready, uid, onGenerated }: AIDescriptionButtonProps) {
  const { generate, loading, error, remaining } = useAIDescription(uid);
  const exhausted = remaining === 0;
  const disabled = !ready || exhausted || loading;

  async function handlePress() {
    const description = await generate(facts);
    if (description) onGenerated(description);
  }

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled, busy: loading }}
        disabled={disabled}
        onPress={handlePress}
        className={`flex-row items-center justify-center gap-1.5 self-start rounded-full bg-primary-600 px-3.5 py-2 active:opacity-80 ${
          disabled ? 'opacity-50' : ''
        }`}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons name="sparkles" size={14} color="#fff" />
        )}
        <Text className="text-sm font-bold text-white">{loading ? 'A gerar…' : 'Gerar com IA'}</Text>
      </Pressable>
      {!ready && (
        <Text className="mt-1 text-xs text-fg-subtle">
          Preencha marca, modelo e ano para gerar a descrição.
        </Text>
      )}
      {exhausted && (
        <Text className="mt-1 text-xs text-warning-600">
          Limite semanal de gerações com IA atingido.
        </Text>
      )}
      {!!error && <Text className="mt-1 text-xs text-danger-600">{error}</Text>}
    </View>
  );
}
