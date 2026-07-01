import { Pressable, ScrollView, Text, View } from 'react-native';

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
  // The ScrollView is wrapped in a plain View so it is sized by its content
  // instead of by the parent flex column — which otherwise stretched the chips
  // to full height on some devices and clipped them on others.
  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          alignItems: 'center',
          gap: 8,
          paddingHorizontal: 16,
          paddingVertical: 8,
        }}
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
    </View>
  );
}
