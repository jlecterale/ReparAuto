import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from './BottomSheet';
import { colors } from '@/theme/colors';

export interface SortOption<T extends string> {
  value: T;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface SortSheetProps<T extends string> {
  visible: boolean;
  onClose: () => void;
  options: SortOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function SortSheet<T extends string>({
  visible,
  onClose,
  options,
  value,
  onChange,
}: SortSheetProps<T>) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Ordenar por">
      <View className="gap-1">
        {options.map((opt) => {
          const ativo = opt.value === value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => {
                onChange(opt.value);
                onClose();
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: ativo }}
              className="flex-row items-center rounded-xl px-3 py-3.5 active:bg-neutral-100"
            >
              {opt.icon && (
                <Ionicons
                  name={opt.icon}
                  size={18}
                  color={ativo ? colors.primary[600] : colors.fg.muted}
                  style={{ marginRight: 10 }}
                />
              )}
              <Text className={`flex-1 text-base ${ativo ? 'font-bold text-primary-700' : 'text-fg'}`}>
                {opt.label}
              </Text>
              {ativo && <Ionicons name="checkmark" size={20} color={colors.primary[600]} />}
            </Pressable>
          );
        })}
      </View>
    </BottomSheet>
  );
}
