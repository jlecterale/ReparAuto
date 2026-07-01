import { ActivityIndicator, Pressable, Text } from 'react-native';
import type { ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost';

const BASE = 'flex-row items-center justify-center rounded-xl px-5 py-3.5 active:opacity-80';
const VARIANT: Record<Variant, string> = {
  primary: 'bg-primary-600',
  secondary: 'bg-accent',
  outline: 'border border-neutral-300 bg-white',
  ghost: 'bg-transparent',
};
const LABEL: Record<Variant, string> = {
  primary: 'text-white',
  secondary: 'text-white',
  outline: 'text-primary-700',
  ghost: 'text-primary-700',
};

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  className?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  className = '',
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      className={`${BASE} ${VARIANT[variant]} ${isDisabled ? 'opacity-50' : ''} ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? '#0a4485' : '#fff'} />
      ) : (
        <>
          {icon}
          <Text className={`text-base font-bold ${LABEL[variant]} ${icon ? 'ml-2' : ''}`}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}
