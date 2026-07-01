import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useEmailVerification } from '@/hooks/useEmailVerification';
import { Button } from '@/components/ui/Button';
import { colors } from '@/theme/colors';

/**
 * Full-screen block shown in place of the listing forms when a signed-in user
 * hasn't verified their email. Listings require a verified email (Firestore
 * rules), so instead of letting the form submit fail with a cryptic error we
 * explain the requirement up front and offer resend / re-check actions. Once the
 * email is verified the parent layout reactively swaps this for the real flow.
 */
export function VerifyEmailGate() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { reenviar, verificar, resending, checking } = useEmailVerification();

  return (
    <View className="flex-1 bg-neutral-50" style={{ paddingTop: insets.top }}>
      <View className="px-4 pt-2">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Fechar"
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full active:bg-neutral-100"
        >
          <Ionicons name="close" size={24} color={colors.neutral[700]} />
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="flex-grow items-center justify-center px-6 py-8">
        <View className="mb-5 h-20 w-20 items-center justify-center rounded-full bg-warning-50">
          <Ionicons name="mail-unread-outline" size={40} color={colors.warning[500]} />
        </View>
        <Text className="text-center text-2xl font-extrabold text-fg-heading">
          Verifique o seu email
        </Text>
        <Text className="mt-2 text-center text-base leading-relaxed text-fg-muted">
          Para publicar anúncios precisa de confirmar o seu endereço de email
          {user?.email ? ` (${user.email})` : ''}. Enviámos-lhe um link de verificação — depois de
          confirmar, toque em “Já verifiquei”.
        </Text>

        <View className="mt-7 w-full gap-3">
          <Button
            label={checking ? 'A verificar…' : 'Já verifiquei'}
            onPress={verificar}
            loading={checking}
          />
          <Pressable
            onPress={reenviar}
            disabled={resending}
            accessibilityRole="button"
            className="items-center py-2 active:opacity-70"
          >
            <Text className="text-sm font-semibold text-primary-700">
              {resending ? 'A enviar…' : 'Reenviar email de verificação'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
