import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { colors } from '@/theme/colors';

export interface PhotoSourceOption {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  action: () => void;
}

/**
 * Source chooser for adding a photo (camera / gallery / …). A BottomSheet
 * instead of Alert.alert because Android alerts cap at 3 buttons. The picked
 * action only runs after the sheet Modal has dismissed — presenting the
 * native picker (or another Modal) while it is still animating out fails
 * silently on iOS.
 */
export function PhotoSourceSheet({
  visible,
  onClose,
  title,
  options,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: PhotoSourceOption[];
}) {
  function runAfterClose(action: () => void) {
    onClose();
    setTimeout(action, 350);
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      <View className="gap-1">
        {options.map((opt) => (
          <Pressable
            key={opt.label}
            onPress={() => runAfterClose(opt.action)}
            accessibilityRole="button"
            className="flex-row items-center rounded-xl px-3 py-3.5 active:bg-neutral-100"
          >
            <Ionicons
              name={opt.icon}
              size={20}
              color={colors.primary[600]}
              style={{ marginRight: 12 }}
            />
            <Text className="flex-1 text-base text-fg">{opt.label}</Text>
          </Pressable>
        ))}
      </View>
    </BottomSheet>
  );
}
