import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SearchBar } from '@/components/ui/SearchBar';
import { colors } from '@/theme/colors';

interface SelectFieldProps {
  label?: string;
  /** Current value; '' means nothing selected. */
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  /** Sheet title (defaults to the label). */
  title?: string;
  /** Allow typing a value that isn't in the list (e.g. a missing brand). */
  allowCustom?: boolean;
  /** Disables opening (e.g. model picker before a brand is chosen). */
  disabled?: boolean;
  loading?: boolean;
  /**
   * When set, an extra option at the top clears the selection (value '').
   * Used by filters, e.g. emptyOption="Todas".
   */
  emptyOption?: string;
}

/**
 * A tappable field that opens a searchable bottom-sheet list. Built for long
 * option sets (brands/models) where wrapping chips would be unusable. With
 * `allowCustom`, the typed term can be used as-is so listings are never blocked
 * by a brand/model missing from the catalogue.
 */
export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = 'Selecionar',
  title,
  allowCustom = false,
  disabled = false,
  loading = false,
  emptyOption,
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const [busca, setBusca] = useState('');

  const termo = busca.trim();
  const filtradas = useMemo(() => {
    if (!termo) return options;
    const t = termo.toLowerCase();
    return options.filter((o) => o.toLowerCase().includes(t));
  }, [options, termo]);

  const showCustom =
    allowCustom &&
    termo.length > 0 &&
    !options.some((o) => o.toLowerCase() === termo.toLowerCase());

  function selecionar(v: string) {
    onChange(v);
    setBusca('');
    setOpen(false);
  }

  return (
    <View className="w-full">
      {label && <Text className="mb-1.5 text-sm font-semibold text-fg-muted">{label}</Text>}
      <Pressable
        onPress={() => !disabled && setOpen(true)}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        className={`flex-row items-center justify-between rounded-xl border border-neutral-300 bg-white px-4 py-3.5 ${
          disabled ? 'opacity-50' : 'active:opacity-80'
        }`}
      >
        <Text className={`flex-1 text-base ${value ? 'text-fg' : 'text-neutral-500'}`} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.fg.subtle} />
      </Pressable>

      <BottomSheet visible={open} onClose={() => setOpen(false)} title={title ?? label ?? 'Selecionar'}>
        <View className="mb-3">
          <SearchBar value={busca} onChangeText={setBusca} placeholder="Procurar…" />
        </View>

        {emptyOption !== undefined && (
          <Row label={emptyOption} selected={value === ''} onPress={() => selecionar('')} muted />
        )}

        {showCustom && (
          <Row
            label={`Usar “${termo}”`}
            selected={false}
            onPress={() => selecionar(termo)}
            icon="add-circle-outline"
          />
        )}

        {loading ? (
          <Text className="py-6 text-center text-sm text-fg-subtle">A carregar…</Text>
        ) : filtradas.length === 0 && !showCustom ? (
          <Text className="py-6 text-center text-sm text-fg-subtle">Sem resultados.</Text>
        ) : (
          filtradas.map((opt) => (
            <Row key={opt} label={opt} selected={opt === value} onPress={() => selecionar(opt)} />
          ))
        )}
      </BottomSheet>
    </View>
  );
}

function Row({
  label,
  selected,
  onPress,
  muted = false,
  icon,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  muted?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className="flex-row items-center justify-between border-b border-neutral-100 py-3 active:opacity-70"
    >
      <View className="flex-1 flex-row items-center">
        {icon && (
          <Ionicons name={icon} size={18} color={colors.primary[600]} style={{ marginRight: 8 }} />
        )}
        <Text className={`text-base ${muted ? 'text-fg-muted' : 'text-fg-heading'}`}>{label}</Text>
      </View>
      {selected && <Ionicons name="checkmark" size={20} color={colors.primary[600]} />}
    </Pressable>
  );
}
