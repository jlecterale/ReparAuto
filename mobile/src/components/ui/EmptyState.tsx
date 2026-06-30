import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { colors } from '@/theme/colors';

interface EmptyStateAction {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  titulo: string;
  texto?: string;
  action?: EmptyStateAction;
}

export function EmptyState({ icon, titulo, texto, action }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-20">
      <Ionicons name={icon} size={56} color={colors.neutral[300]} />
      <Text className="mt-4 text-lg font-bold text-fg-heading">{titulo}</Text>
      {!!texto && <Text className="mt-1 text-center text-fg-muted">{texto}</Text>}
      {action && (
        <Button
          label={action.label}
          onPress={action.onPress}
          className="mt-6"
          icon={
            action.icon ? <Ionicons name={action.icon} size={18} color="#fff" /> : undefined
          }
        />
      )}
    </View>
  );
}
