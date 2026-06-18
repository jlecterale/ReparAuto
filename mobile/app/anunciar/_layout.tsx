import { Stack } from 'expo-router';
import { colors } from '@/theme/colors';

export default function AnunciarLayout() {
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
