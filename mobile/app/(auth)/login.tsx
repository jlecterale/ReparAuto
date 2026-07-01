import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Link, router, useLocalSearchParams, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import { KeyboardAvoider } from '@/components/ui/KeyboardAvoider';
import { Screen } from '@/components/ui/Screen';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LogoMark } from '@/components/ui/Logo';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { statusCodes } from '@/lib/auth';
import { colors } from '@/theme/colors';

export default function LoginScreen() {
  const { login, loginGoogle, loginApple, appleDisponivel } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { next, contexto, fromTour } = useLocalSearchParams<{ next?: string; contexto?: string; fromTour?: string }>();
  const authParams: Record<string, string> = {};
  if (next) authParams.next = next;
  if (contexto) authParams.contexto = contexto;
  if (fromTour) authParams.fromTour = fromTour;

  // After authenticating (the auth flow is a modal): from the welcome, head
  // straight to the chosen flow (`next`); otherwise, if the profile is
  // incomplete, send the user to Perfil to finish it (mirrors the web's
  // setup-perfil redirect); else return to where they were.
  function aposLogin(profileCompleted: boolean) {
    if (router.canDismiss()) router.dismiss();
    if (next) {
      // Defer a tick so the (auth) modal finishes dismissing before its target
      // modal (e.g. /anunciar/*) is presented.
      setTimeout(() => router.navigate(next as Href), 0);
      return;
    }
    if (!profileCompleted) router.navigate('/perfil');
    else if (!router.canGoBack()) router.replace('/');
  }

  async function handleLogin() {
    if (!email.trim() || !password) {
      showToast('Preencha o email e a palavra-passe.', 'error');
      return;
    }
    setLoading(true);
    try {
      const u = await login(email.trim(), password);
      aposLogin(u.profileCompleted);
    } catch {
      showToast('Credenciais inválidas. Tente novamente.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    try {
      const u = await loginGoogle();
      aposLogin(u.profileCompleted);
    } catch (e) {
      const err = e as { code?: string; message?: string };
      const isDevError = String(err.code) === '10' || /DEVELOPER_ERROR/i.test(err.message ?? '');
      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        // user dismissed the chooser — no error
      } else if (isDevError) {
        showToast('Login Google não configurado: falta registar o SHA-1 no Firebase.', 'error');
      } else {
        showToast('Não foi possível entrar com o Google.', 'error');
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleApple() {
    try {
      const u = await loginApple();
      aposLogin(u.profileCompleted);
    } catch (e) {
      // User cancellation is silent; everything else surfaces an error.
      const code = (e as { code?: string })?.code;
      if (code !== 'ERR_REQUEST_CANCELED' && code !== 'ERR_CANCELED') {
        showToast('Não foi possível entrar com a Apple.', 'error');
      }
    }
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <KeyboardAvoider className="flex-1">
        <ScrollView
          contentContainerClassName="flex-grow justify-center px-6 py-10"
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-8 items-center">
            <LogoMark size={64} />
            <Text className="mt-4 text-3xl font-extrabold text-primary-900">
              Recar<Text className="text-accent">Garage</Text>
            </Text>
            <Text className="mt-1 text-base text-fg-muted">
              Entre na sua conta para continuar
            </Text>
          </View>

          {contexto ? (
            <View className="mb-5 flex-row items-start gap-2 rounded-xl border border-accent/20 bg-accent/10 p-3">
              <Ionicons name="sparkles" size={16} color={colors.accent} style={{ marginTop: 1 }} />
              <Text className="flex-1 text-sm font-medium text-fg">{contexto}</Text>
            </View>
          ) : null}

          <View className="gap-4">
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="o.seu@email.pt"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <Input
              label="Palavra-passe"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              autoComplete="password"
            />

            <Button label="Entrar" onPress={handleLogin} loading={loading} />

            <View className="my-2 flex-row items-center gap-3">
              <View className="h-px flex-1 bg-neutral-200" />
              <Text className="text-sm text-fg-subtle">ou</Text>
              <View className="h-px flex-1 bg-neutral-200" />
            </View>

            <Button
              label="Continuar com Google"
              variant="outline"
              loading={googleLoading}
              onPress={handleGoogle}
              icon={<Ionicons name="logo-google" size={18} color={colors.primary[700]} />}
            />

            {appleDisponivel && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={12}
                style={{ height: 50, width: '100%' }}
                onPress={handleApple}
              />
            )}
          </View>

          <View className="mt-8 flex-row justify-center">
            <Text className="text-fg-muted">Ainda não tem conta? </Text>
            <Link href={{ pathname: '/registar', params: authParams }} asChild>
              <Pressable>
                <Text className="font-bold text-primary-700">Criar conta</Text>
              </Pressable>
            </Link>
          </View>

          <Text className="mt-6 px-4 text-center text-xs text-fg-subtle">
            Ao continuar, aceita os{' '}
            <Text
              className="font-semibold text-primary-700"
              onPress={() => WebBrowser.openBrowserAsync('https://www.recargarage.com/termos')}
            >
              Termos
            </Text>{' '}
            e a{' '}
            <Text
              className="font-semibold text-primary-700"
              onPress={() => WebBrowser.openBrowserAsync('https://www.recargarage.com/privacidade')}
            >
              Política de Privacidade
            </Text>
            .
          </Text>
        </ScrollView>
      </KeyboardAvoider>
    </Screen>
  );
}
