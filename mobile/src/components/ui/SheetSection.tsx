import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

interface SheetSectionProps {
  title: string;
  children: ReactNode;
  /** First section skips the top divider/spacing. */
  first?: boolean;
}

/** A labelled block inside a bottom sheet, with a divider + breathing room. */
export function SheetSection({ title, children, first }: SheetSectionProps) {
  return (
    <View className={first ? 'pt-1' : 'mt-5 border-t border-neutral-200 pt-5'}>
      <Text className="mb-3 text-xs font-bold uppercase tracking-wider text-fg-subtle">
        {title}
      </Text>
      {children}
    </View>
  );
}
