import { Pressable, Text, View } from 'react-native';
import type { ChipSelectOption } from './ChipSelect';

interface MultiChipSelectProps<T extends string> {
  label?: string;
  options: ChipSelectOption<T>[];
  values: T[];
  onToggle: (value: T) => void;
}

/** Wrapping multi-select chips — for sets like workshop specialities. */
export function MultiChipSelect<T extends string>({
  label,
  options,
  values,
  onToggle,
}: MultiChipSelectProps<T>) {
  return (
    <View className="w-full">
      {label && (
        <Text className="mb-1.5 text-sm font-semibold text-fg-muted">{label}</Text>
      )}
      <View className="flex-row flex-wrap gap-2">
        {options.map((opt) => {
          const ativo = values.includes(opt.value);
          return (
            <Pressable
              key={opt.value}
              onPress={() => onToggle(opt.value)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: ativo }}
              className={`rounded-full border px-3.5 py-2 ${
                ativo ? 'border-primary-600 bg-primary-50' : 'border-neutral-300 bg-white'
              }`}
            >
              <Text className={`text-sm font-semibold ${ativo ? 'text-primary-700' : 'text-fg-muted'}`}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
