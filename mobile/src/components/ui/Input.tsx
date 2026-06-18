import { Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';
import { colors } from '@/theme/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <View className="w-full">
      {label && (
        <Text className="mb-1.5 text-sm font-semibold text-fg-muted">{label}</Text>
      )}
      <TextInput
        placeholderTextColor={colors.neutral[500]}
        className={`rounded-xl border bg-white px-4 py-3.5 text-base text-fg ${
          error ? 'border-danger-500' : 'border-neutral-300'
        } ${className}`}
        {...props}
      />
      {error && <Text className="mt-1 text-sm text-danger-600">{error}</Text>}
    </View>
  );
}
