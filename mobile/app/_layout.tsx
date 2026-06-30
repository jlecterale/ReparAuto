import '../global.css';

import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { FavoritosProvider } from '@/context/FavoritosContext';
import { ChatProvider } from '@/context/ChatContext';
import { NotificacoesProvider } from '@/context/NotificacoesContext';
import { ToastProvider } from '@/context/ToastContext';
import { OnboardingProvider } from '@/context/OnboardingContext';
import { registerForPush, setupPushHandlers, unregisterPush } from '@/lib/push';
import { useOTAUpdates } from '@/hooks/useOTAUpdates';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { OnboardingGate } from '@/components/onboarding/OnboardingGate';
import { UpdateBanner } from '@/components/ui/UpdateBanner';
import type { Href } from 'expo-router';
import { colors } from '@/theme/colors';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigator() {
  const { loading, user } = useAuth();
  const uid = user?.uid ?? null;

  // Silently check for and download OTA updates (applied on next launch).
  useOTAUpdates();

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync().catch(() => {});
  }, [loading]);

  // Register for push when signed in; clean up the token on sign-out.
  useEffect(() => {
    if (!uid) return;
    registerForPush(uid).catch(() => {});
    const unsub = setupPushHandlers((data) => {
      const link = data?.link;
      if (typeof link === 'string' && link.startsWith('/')) {
        router.push(link as Href);
      } else {
        router.push('/notificacoes');
      }
    });
    return () => {
      unsub();
      unregisterPush(uid).catch(() => {});
    };
  }, [uid]);

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
      <Stack.Screen name="intencoes/index" options={{ headerShown: true, title: 'Procuras' }} />
      <Stack.Screen name="intencoes/[id]" options={{ headerShown: true, title: '' }} />
      <Stack.Screen name="denunciar" options={{ headerShown: true, title: 'Denunciar', presentation: 'modal' }} />
      <Stack.Screen name="avaliar" options={{ headerShown: true, title: 'Avaliar', presentation: 'modal' }} />
      <Stack.Screen name="chat/[listingId]" options={{ headerShown: true, title: 'Conversa' }} />
      <Stack.Screen name="favoritos" options={{ headerShown: true, title: 'Favoritos' }} />
      <Stack.Screen name="notificacoes" options={{ headerShown: true, title: 'Notificações' }} />
      <Stack.Screen name="anunciar" options={{ presentation: 'modal' }} />
      <Stack.Screen name="perfil/editar" options={{ headerShown: true, title: 'Editar perfil' }} />
      <Stack.Screen name="meus-anuncios" options={{ headerShown: true, title: 'Os meus anúncios' }} />
      <Stack.Screen name="definicoes" options={{ headerShown: true, title: 'Definições' }} />
      <Stack.Screen name="admin" options={{ headerShown: false }} />
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
            <ChatProvider>
              <NotificacoesProvider>
                <ToastProvider>
                  <OnboardingProvider>
                    <StatusBar style="dark" />
                    <UpdateBanner />
                    <OfflineBanner />
                    <RootNavigator />
                    <OnboardingGate />
                  </OnboardingProvider>
                </ToastProvider>
              </NotificacoesProvider>
            </ChatProvider>
          </FavoritosProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
