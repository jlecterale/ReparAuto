import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useEmailVerification } from '@/hooks/useEmailVerification';
import { colors } from '@/theme/colors';

/**
 * Slim top banner shown to signed-in users whose email isn't verified yet.
 * The profile can still be saved, but listings and messages require a verified
 * email — this nudges the user there with resend / re-check actions. Mirrors the
 * web app's amber verification banner.
 */
export function EmailVerificationBanner() {
  const insets = useSafeAreaInsets();
  const { isLoggedIn, emailVerified } = useAuth();
  const { reenviar, verificar, resending, checking } = useEmailVerification();

  if (!isLoggedIn || emailVerified) return null;

  return (
    <View style={{ paddingTop: insets.top }} className="border-b border-warning-200 bg-warning-50">
      <View className="flex-row items-start gap-2 px-3 pt-2">
        <Ionicons name="mail-unread-outline" size={16} color={colors.warning[500]} style={{ marginTop: 1 }} />
        <Text className="flex-1 text-xs font-medium text-warning-800">
          Confirme o seu email para publicar anúncios e enviar mensagens.
        </Text>
      </View>
      <View className="flex-row gap-2 px-3 pb-2 pt-2">
        <Pressable
          onPress={reenviar}
          disabled={resending}
          accessibilityRole="button"
          accessibilityLabel="Reenviar email de verificação"
          className="rounded-lg border border-warning-300 bg-white px-3 py-1.5 active:opacity-80"
        >
          <Text className="text-xs font-semibold text-warning-800">
            {resending ? 'A enviar…' : 'Reenviar email'}
          </Text>
        </Pressable>
        <Pressable
          onPress={verificar}
          disabled={checking}
          accessibilityRole="button"
          accessibilityLabel="Já verifiquei o meu email"
          className="rounded-lg bg-warning-700 px-3 py-1.5 active:opacity-80"
        >
          <Text className="text-xs font-semibold text-white">
            {checking ? 'A verificar…' : 'Já verifiquei'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
