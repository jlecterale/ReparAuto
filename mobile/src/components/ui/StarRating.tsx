import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

interface StarRatingProps {
  value: number;
  onChange?: (n: number) => void;
  size?: number;
}

/** Read-only when `onChange` is omitted; otherwise tappable 1–5 stars. */
export function StarRating({ value, onChange, size = 20 }: StarRatingProps) {
  return (
    <View className="flex-row">
      {[1, 2, 3, 4, 5].map((n) => {
        const ativo = n <= Math.round(value);
        const star = (
          <Ionicons
            name={ativo ? 'star' : 'star-outline'}
            size={size}
            color={colors.warning[500]}
            style={{ marginRight: 2 }}
          />
        );
        return onChange ? (
          <Pressable key={n} onPress={() => onChange(n)} hitSlop={4} accessibilityRole="button" accessibilityLabel={`${n} estrelas`}>
            {star}
          </Pressable>
        ) : (
          <View key={n}>{star}</View>
        );
      })}
    </View>
  );
}
