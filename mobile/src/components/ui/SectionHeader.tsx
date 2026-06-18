import { Text, View } from 'react-native';
import type { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  right?: ReactNode;
}

export function SectionHeader({ title, right }: SectionHeaderProps) {
  return (
    <View className="flex-row items-center justify-between border-b border-neutral-200 px-4 pb-3 pt-1">
      <Text className="text-2xl font-extrabold text-primary-900">{title}</Text>
      {right}
    </View>
  );
}
