import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFavoritos } from '@/context/FavoritosContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { colors } from '@/theme/colors';

interface FavoriteButtonProps {
  id: string;
  size?: number;
  /** Solid circular background — for use over images. */
  floating?: boolean;
}

export function FavoriteButton({ id, size = 22, floating = false }: FavoriteButtonProps) {
  const { isFavorito, toggleFavorito } = useFavoritos();
  const requireAuth = useRequireAuth();
  const ativo = isFavorito(id);

  return (
    <Pressable
      onPress={() =>
        requireAuth(() => {
          Haptics.selectionAsync().catch(() => {});
          toggleFavorito(id);
        })
      }
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={ativo ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      className={floating ? 'h-9 w-9 items-center justify-center rounded-full bg-white/90' : ''}
    >
      <Ionicons
        name={ativo ? 'heart' : 'heart-outline'}
        size={size}
        color={ativo ? colors.danger[500] : floating ? colors.neutral[700] : colors.neutral[400]}
      />
    </Pressable>
  );
}
