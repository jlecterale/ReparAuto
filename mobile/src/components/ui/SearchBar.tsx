import { TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChangeText, placeholder }: SearchBarProps) {
  return (
    <View className="flex-row items-center rounded-xl border border-neutral-300 bg-white px-3">
      <Ionicons name="search" size={18} color={colors.fg.subtle} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.neutral[500]}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        className="flex-1 px-2 py-3 text-base text-fg"
      />
      {value.length > 0 && (
        <Ionicons
          name="close-circle"
          size={18}
          color={colors.neutral[400]}
          onPress={() => onChangeText('')}
        />
      )}
    </View>
  );
}
