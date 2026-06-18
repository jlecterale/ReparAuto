import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  titulo: string;
  texto?: string;
}

export function EmptyState({ icon, titulo, texto }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-20">
      <Ionicons name={icon} size={56} color={colors.neutral[300]} />
      <Text className="mt-4 text-lg font-bold text-fg-heading">{titulo}</Text>
      {!!texto && <Text className="mt-1 text-center text-fg-muted">{texto}</Text>}
    </View>
  );
}
