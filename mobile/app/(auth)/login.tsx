import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LogoMark } from '@/components/ui/Logo';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { colors } from '@/theme/colors';

export default function LoginScreen() {
  const { login, loginGoogle } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      showToast('Preencha o email e a palavra-passe.', 'error');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch {
      showToast('Credenciais inválidas. Tente novamente.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    try {
      await loginGoogle();
    } catch {
      showToast('Não foi possível entrar com o Google.', 'error');
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center px-6 py-10"
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-8 items-center">
            <LogoMark size={64} />
            <Text className="mt-4 text-3xl font-extrabold text-primary-900">
              Repar<Text className="text-accent">Auto</Text>
            </Text>
            <Text className="mt-1 text-base text-fg-muted">
              Entre na sua conta para continuar
            </Text>
          </View>

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
          </View>

          <View className="mt-8 flex-row justify-center">
            <Text className="text-fg-muted">Ainda não tem conta? </Text>
            <Link href="/registar" asChild>
              <Pressable>
                <Text className="font-bold text-primary-700">Criar conta</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
