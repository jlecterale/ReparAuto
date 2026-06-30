import { Stack } from 'expo-router';
import { colors } from '@/theme/colors';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTintColor: colors.primary[700],
        headerTitleStyle: { color: colors.primary[900] },
        contentStyle: { backgroundColor: colors.neutral[50] },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Painel Admin' }} />
      <Stack.Screen name="anuncios" options={{ title: 'Anúncios pendentes' }} />
      <Stack.Screen name="denuncias" options={{ title: 'Denúncias' }} />
      <Stack.Screen name="verificacoes" options={{ title: 'Verificações' }} />
    </Stack>
  );
}
