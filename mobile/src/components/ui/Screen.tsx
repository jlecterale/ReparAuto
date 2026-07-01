import { View } from 'react-native';
import type { ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Edge } from 'react-native-safe-area-context';

interface ScreenProps {
  children: ReactNode;
  edges?: Edge[];
  className?: string;
}

/** Standard page surface: neutral background + safe-area padding. */
export function Screen({ children, edges = ['top'], className = '' }: ScreenProps) {
  return (
    <SafeAreaView edges={edges} className="flex-1 bg-neutral-50">
      <View className={`flex-1 ${className}`}>{children}</View>
    </SafeAreaView>
  );
}
