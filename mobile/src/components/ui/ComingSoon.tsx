import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

interface ComingSoonProps {
  icon: keyof typeof Ionicons.glyphMap;
  titulo: string;
  texto: string;
}

/** Placeholder for sections scheduled in later roadmap phases. */
export function ComingSoon({ icon, titulo, texto }: ComingSoonProps) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="mb-5 h-20 w-20 items-center justify-center rounded-full bg-primary-50">
        <Ionicons name={icon} size={36} color={colors.primary[600]} />
      </View>
      <Text className="text-2xl font-extrabold text-fg-heading">{titulo}</Text>
      <Text className="mt-2 text-center text-base text-fg-muted">{texto}</Text>
      <View className="mt-4 rounded-full bg-secondary-100 px-3 py-1">
        <Text className="text-xs font-bold uppercase tracking-wider text-secondary-700">
          Em breve
        </Text>
      </View>
    </View>
  );
}
