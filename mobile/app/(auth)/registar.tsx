import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Link, router, useLocalSearchParams, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAvoider } from '@/components/ui/KeyboardAvoider';
import { Screen } from '@/components/ui/Screen';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useOnboarding } from '@/context/OnboardingContext';
import { colors } from '@/theme/colors';

export default function RegistarScreen() {
  const { registar } = useAuth();
  const { showToast } = useToast();
  const { openTour } = useOnboarding();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { next, contexto, fromTour } = useLocalSearchParams<{ next?: string; contexto?: string; fromTour?: string }>();
  const authParams: Record<string, string> = {};
  if (next) authParams.next = next;
  if (contexto) authParams.contexto = contexto;
  if (fromTour) authParams.fromTour = fromTour;

  // Backing out of signup should return to the welcome tour it came from — not
  // dismiss to the listings underneath.
  function handleVoltar() {
    if (fromTour) {
      openTour();
      if (router.canDismiss()) {
        router.dismissAll();
        return;
      }
    }
    router.back();
  }

  async function handleRegistar() {
    if (!nome.trim() || !email.trim() || !password) {
      showToast('Preencha todos os campos.', 'error');
      return;
    }
    if (password.length < 8) {
      showToast('A palavra-passe deve ter pelo menos 8 caracteres.', 'error');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      showToast('A palavra-passe deve conter pelo menos uma letra maiúscula.', 'error');
      return;
    }
    if (!/\d/.test(password)) {
      showToast('A palavra-passe deve conter pelo menos um número.', 'error');
      return;
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      showToast('A palavra-passe deve conter pelo menos um símbolo.', 'error');
      return;
    }
    setLoading(true);
    try {
      await registar(nome.trim(), email.trim(), password);
      if (router.canDismiss()) router.dismiss();
      // From the welcome, head straight to the chosen creation flow; otherwise
      // go to Perfil so the user can finish the (still incomplete) profile. The
      // next-route is deferred a tick so the (auth) modal finishes dismissing
      // before its target modal (e.g. /anunciar/*) is presented.
      if (next) setTimeout(() => router.navigate(next as Href), 0);
      else router.navigate('/perfil');
    } catch {
      showToast('Não foi possível criar a conta. O email pode já existir.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <KeyboardAvoider className="flex-1">
        <ScrollView
          contentContainerClassName="flex-grow justify-center px-6 py-10"
          keyboardShouldPersistTaps="handled"
        >
          <Pressable onPress={handleVoltar} className="mb-6 flex-row items-center">
            <Ionicons name="chevron-back" size={22} color={colors.primary[700]} />
            <Text className="font-semibold text-primary-700">Voltar</Text>
          </Pressable>

          <Text className="text-3xl font-extrabold text-primary-900">Criar conta</Text>
          <Text className="mb-8 mt-1 text-base text-fg-muted">
            Junte-se ao maior marketplace automóvel.
          </Text>

          {contexto ? (
            <View className="mb-5 flex-row items-start gap-2 rounded-xl border border-accent/20 bg-accent/10 p-3">
              <Ionicons name="sparkles" size={16} color={colors.accent} style={{ marginTop: 1 }} />
              <Text className="flex-1 text-sm font-medium text-fg">{contexto}</Text>
            </View>
          ) : null}

          <View className="gap-4">
            <Input label="Nome" value={nome} onChangeText={setNome} placeholder="O seu nome" />
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
              placeholder="Mínimo 8 caracteres"
              secureTextEntry
              autoComplete="password-new"
            />
            {password.length > 0 && (
              <View className="-mt-1 gap-1.5">
                {([
                  { label: 'Mínimo 8 caracteres', valid: password.length >= 8 },
                  { label: 'Uma letra maiúscula', valid: /[A-Z]/.test(password) },
                  { label: 'Um número', valid: /\d/.test(password) },
                  { label: 'Um símbolo (!@#$...)', valid: /[^A-Za-z0-9]/.test(password) },
                ] as const).map((check) => (
                  <View key={check.label} className="flex-row items-center gap-1.5">
                    <Ionicons
                      name={check.valid ? 'checkmark-circle' : 'ellipse-outline'}
                      size={14}
                      color={check.valid ? colors.success[500] : colors.neutral[400]}
                    />
                    <Text className={`text-xs ${check.valid ? 'font-medium text-success-600' : 'text-fg-subtle'}`}>
                      {check.label}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            <Button
              label="Criar conta"
              onPress={handleRegistar}
              loading={loading}
              disabled={!nome.trim() || !email.trim() || !password || password.length < 8 || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)}
            />
          </View>

          <View className="mt-8 flex-row justify-center">
            <Text className="text-fg-muted">Já tem conta? </Text>
            <Link href={{ pathname: '/login', params: authParams }} asChild>
              <Pressable>
                <Text className="font-bold text-primary-700">Entrar</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoider>
    </Screen>
  );
}
