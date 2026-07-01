import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Sticky footer (e.g. Limpar / Ver resultados). */
  footer?: ReactNode;
}

/** Slide-up modal sheet with a dimmed backdrop and a scrollable body. */
export function BottomSheet({ visible, onClose, title, children, footer }: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        {/* Backdrop */}
        <Pressable className="flex-1" onPress={onClose} accessibilityLabel="Fechar" />

        {/* Numeric maxHeight (not a %) so the column is reliably bounded and the
            ScrollView can shrink + scroll on every device. */}
        <View style={{ maxHeight: height * 0.85 }} className="rounded-t-3xl bg-neutral-50">
          {/* Handle + header */}
          <View className="items-center pt-2.5">
            <View className="h-1 w-10 rounded-full bg-neutral-300" />
          </View>
          <View className="flex-row items-center justify-between px-5 pb-2 pt-3">
            <Text className="text-lg font-extrabold text-fg-heading">{title}</Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Fechar">
              <Ionicons name="close" size={24} color={colors.fg.muted} />
            </Pressable>
          </View>

          <ScrollView
            // flexShrink:1 lets the scroll area yield space to the sticky footer
            // (RN defaults flexShrink to 0), so long content scrolls instead of
            // pushing the footer over it.
            style={{ flexShrink: 1 }}
            contentContainerClassName="px-5 pb-5"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
          >
            {children}
          </ScrollView>

          {footer && (
            <View
              className="flex-row gap-3 border-t border-neutral-200 bg-white px-5 pt-3"
              style={{ paddingBottom: insets.bottom + 12 }}
            >
              {footer}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
