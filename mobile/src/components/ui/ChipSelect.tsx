import { Pressable, Text, View } from 'react-native';

export interface ChipSelectOption<T extends string> {
  value: T;
  label: string;
}

interface ChipSelectProps<T extends string> {
  label?: string;
  options: ChipSelectOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
}

/** Wrapping single-select chips — for short enumerations (fuel, gearbox…). */
export function ChipSelect<T extends string>({
  label,
  options,
  value,
  onChange,
}: ChipSelectProps<T>) {
  return (
    <View className="w-full">
      {label && (
        <Text className="mb-1.5 text-sm font-semibold text-fg-muted">{label}</Text>
      )}
      <View className="flex-row flex-wrap gap-2">
        {options.map((opt) => {
          const ativo = opt.value === value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onChange(opt.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: ativo }}
              className={`rounded-full border px-4 py-2 ${
                ativo ? 'border-primary-600 bg-primary-600' : 'border-neutral-300 bg-white'
              }`}
            >
              <Text className={`text-sm font-semibold ${ativo ? 'text-white' : 'text-fg-muted'}`}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
