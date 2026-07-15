import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAvoider } from '@/components/ui/KeyboardAvoider';
import { Screen } from '@/components/ui/Screen';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LogoMark } from '@/components/ui/Logo';
import { enviarEmailReset } from '@/lib/auth';
import { useToast } from '@/context/ToastContext';
import { colors } from '@/theme/colors';

export default function RecuperarScreen() {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleEnviar() {
    const value = email.trim();
    if (!value) {
      showToast('Introduza o seu email para recuperar a palavra-passe.', 'error');
      return;
    }
    setLoading(true);
    try {
      await enviarEmailReset(value);
      setSent(true);
    } catch (e) {
      const code = (e as { code?: string })?.code ?? '';
      if (code.includes('invalid-email')) {
        showToast('O email introduzido não é válido.', 'error');
      } else if (code.includes('user-not-found')) {
        // Same neutral outcome as an existing account — avoids confirming to a
        // third party whether an email is registered.
        setSent(true);
      } else {
        showToast('Não foi possível enviar o email. Tente novamente.', 'error');
      }
    } finally {
      setLoading(false);
    }
  }

  function voltarAoLogin() {
    if (router.canGoBack()) router.back();
    else router.replace('/login');
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
            <Text className="mt-4 text-2xl font-extrabold text-primary-900">
              Recuperar palavra-passe
            </Text>
            <Text className="mt-1 text-center text-base text-fg-muted">
              Indique o email da sua conta e enviamos-lhe um link para definir
              uma nova palavra-passe.
            </Text>
          </View>

          {sent ? (
            <View className="gap-4">
              <View className="flex-row items-start gap-2 rounded-xl border border-success-500/20 bg-success-500/10 p-3">
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={colors.success[600]}
                  style={{ marginTop: 1 }}
                />
                <Text className="flex-1 text-sm font-medium text-fg">
                  Email de recuperação enviado! Verifique a sua caixa de entrada
                  (e a pasta de spam).
                </Text>
              </View>
              <Button label="Voltar ao login" onPress={voltarAoLogin} />
            </View>
          ) : (
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
              <Button
                label="Enviar link de recuperação"
                onPress={handleEnviar}
                loading={loading}
              />
            </View>
          )}

          <View className="mt-8 flex-row justify-center">
            <Pressable onPress={voltarAoLogin} hitSlop={8}>
              <Text className="font-bold text-primary-700">Voltar ao login</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoider>
    </Screen>
  );
}
