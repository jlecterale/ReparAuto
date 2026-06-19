import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SearchBar } from './SearchBar';
import { colors } from '@/theme/colors';

interface SearchActionsRowProps {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  /** Number of active filters → shown as a badge; >0 highlights the button. */
  filtersCount?: number;
  onOpenFilters: () => void;
  /** Whether a non-default sort is active → highlights the button. */
  sortActive?: boolean;
  onOpenSort: () => void;
}

export function SearchActionsRow({
  value,
  onChangeText,
  placeholder,
  filtersCount = 0,
  onOpenFilters,
  sortActive = false,
  onOpenSort,
}: SearchActionsRowProps) {
  return (
    <View className="flex-row items-center gap-2 px-4">
      <View className="flex-1">
        <SearchBar value={value} onChangeText={onChangeText} placeholder={placeholder} />
      </View>
      <Trigger
        icon="options-outline"
        label="Filtros"
        active={filtersCount > 0}
        badge={filtersCount}
        onPress={onOpenFilters}
      />
      <Trigger icon="swap-vertical-outline" label="Ordenar" active={sortActive} onPress={onOpenSort} />
    </View>
  );
}

function Trigger({
  icon,
  label,
  active,
  badge = 0,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active: boolean;
  badge?: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className={`h-12 w-12 items-center justify-center rounded-xl border ${
        active ? 'border-primary-600 bg-primary-50' : 'border-neutral-300 bg-white'
      }`}
    >
      <Ionicons name={icon} size={22} color={active ? colors.primary[600] : colors.fg.muted} />
      {badge > 0 && (
        <View className="absolute -right-1.5 -top-1.5 h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1">
          <Text className="text-[11px] font-bold text-white">{badge}</Text>
        </View>
      )}
    </Pressable>
  );
}
