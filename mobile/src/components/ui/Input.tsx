import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', secureTextEntry, ...props }: InputProps) {
  // Password fields get an eye toggle to reveal what was typed (mirrors the
  // web LoginModal). `secureTextEntry` is the caller's intent; `hidden` is the
  // user's current choice.
  const [hidden, setHidden] = useState(true);
  const isPassword = !!secureTextEntry;

  return (
    <View className="w-full">
      {label && (
        <Text className="mb-1.5 text-sm font-semibold text-fg-muted">{label}</Text>
      )}
      <View className="relative">
        <TextInput
          placeholderTextColor={colors.neutral[500]}
          secureTextEntry={isPassword && hidden}
          className={`rounded-xl border bg-white px-4 py-3.5 text-base text-fg ${
            error ? 'border-danger-500' : 'border-neutral-300'
          } ${isPassword ? 'pr-12' : ''} ${className}`}
          {...props}
        />
        {isPassword && (
          <Pressable
            onPress={() => setHidden((v) => !v)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Mostrar palavra-passe' : 'Ocultar palavra-passe'}
            className="absolute bottom-0 right-0 top-0 justify-center px-4"
          >
            <Ionicons
              name={hidden ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={colors.neutral[500]}
            />
          </Pressable>
        )}
      </View>
      {error && <Text className="mt-1 text-sm text-danger-600">{error}</Text>}
    </View>
  );
}
