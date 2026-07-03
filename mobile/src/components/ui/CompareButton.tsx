import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCompare } from '@/hooks/useCompare';
import { useToast } from '@/context/ToastContext';
import { colors } from '@/theme/colors';

interface CompareButtonProps {
  id: string;
  size?: number;
}

/** Floating compare toggle for listing cards (pairs with FavoriteButton). */
export function CompareButton({ id, size = 20 }: CompareButtonProps) {
  const { ids, toggle } = useCompare();
  const { showToast } = useToast();
  const ativo = ids.includes(id);

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        if (!toggle(id)) {
          showToast('Máximo de 3 veículos na comparação.', 'info');
        }
      }}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityState={{ selected: ativo }}
      accessibilityLabel={ativo ? 'Remover da comparação' : 'Adicionar à comparação'}
      className={`h-9 w-9 items-center justify-center rounded-full ${
        ativo ? 'bg-accent' : 'bg-white/90'
      }`}
    >
      <Ionicons
        name={ativo ? 'scale' : 'scale-outline'}
        size={size}
        color={ativo ? '#fff' : colors.neutral[700]}
      />
    </Pressable>
  );
}
