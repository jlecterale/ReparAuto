import { Stack } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { VerifyEmailGate } from '@/components/auth/VerifyEmailGate';
import { colors } from '@/theme/colors';

export default function AnunciarLayout() {
  const { isLoggedIn, emailVerified } = useAuth();

  // Listing creation (cars, parts, services, buy intents) requires a verified
  // email per Firestore rules. Block the forms up front with a clear message
  // instead of letting the submit fail. Guests fall through to the normal flow,
  // which prompts login where needed.
  if (isLoggedIn && !emailVerified) {
    return <VerifyEmailGate />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTintColor: colors.primary[700],
        headerTitleStyle: { color: colors.primary[900] },
        contentStyle: { backgroundColor: colors.neutral[50] },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Anunciar' }} />
      <Stack.Screen name="carro" options={{ title: 'Vender carro' }} />
      <Stack.Screen name="peca" options={{ title: 'Anunciar peça' }} />
      <Stack.Screen name="oficina" options={{ title: 'Registar oficina' }} />
      <Stack.Screen name="intencao" options={{ title: 'Procurar um carro' }} />
    </Stack>
  );
}
