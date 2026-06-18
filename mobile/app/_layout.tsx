import '../global.css';

import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { FavoritosProvider } from '@/context/FavoritosContext';
import { ToastProvider } from '@/context/ToastContext';
import { colors } from '@/theme/colors';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigator() {
  const { loading } = useAuth();

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync().catch(() => {});
  }, [loading]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-50">
        <ActivityIndicator size="large" color={colors.primary[600]} />
      </View>
    );
  }

  // Guest browsing is allowed (App Store Guideline 5.1.1(i)): the marketplace
  // is fully readable without an account. Login is only required for actions
  // (favourite, announce, contact), which push the (auth) modal on demand.
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.neutral[50] } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="detalhes/[id]" options={{ headerShown: true, title: '' }} />
      <Stack.Screen name="pecas/[id]" options={{ headerShown: true, title: '' }} />
      <Stack.Screen name="oficinas/[id]" options={{ headerShown: true, title: '' }} />
      <Stack.Screen
        name="anunciar"
        options={{ headerShown: true, title: 'Anunciar', presentation: 'modal' }}
      />
      <Stack.Screen name="(auth)" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <FavoritosProvider>
            <ToastProvider>
              <StatusBar style="dark" />
              <RootNavigator />
            </ToastProvider>
          </FavoritosProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
