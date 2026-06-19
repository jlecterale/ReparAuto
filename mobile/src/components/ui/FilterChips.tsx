import { Pressable, ScrollView, Text } from 'react-native';

export interface ChipOption<T extends string> {
  value: T;
  label: string;
}

interface FilterChipsProps<T extends string> {
  options: ChipOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
}

export function FilterChips<T extends string>({
  options,
  selected,
  onSelect,
}: FilterChipsProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      // flexGrow:0 stops the row from absorbing vertical space; items-center
      // keeps each chip at its natural height instead of stretching to fill.
      style={{ flexGrow: 0 }}
      contentContainerClassName="items-center gap-2 px-4 py-2"
    >
      {options.map((opt) => {
        const ativo = opt.value === selected;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onSelect(opt.value)}
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
    </ScrollView>
  );
}
