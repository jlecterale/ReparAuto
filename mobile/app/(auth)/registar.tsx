import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { colors } from '@/theme/colors';

export default function RegistarScreen() {
  const { registar } = useAuth();
  const { showToast } = useToast();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegistar() {
    if (!nome.trim() || !email.trim() || !password) {
      showToast('Preencha todos os campos.', 'error');
      return;
    }
    if (password.length < 6) {
      showToast('A palavra-passe deve ter pelo menos 6 caracteres.', 'error');
      return;
    }
    setLoading(true);
    try {
      await registar(nome.trim(), email.trim(), password);
      // New accounts always start with an incomplete profile → go to Perfil
      // so the user can finish it (mirrors the web's setup-perfil step).
      if (router.canDismiss()) router.dismiss();
      router.navigate('/perfil');
    } catch {
      showToast('Não foi possível criar a conta. O email pode já existir.', 'error');
    } finally {
      setLoading(false);
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
          <Pressable onPress={() => router.back()} className="mb-6 flex-row items-center">
            <Ionicons name="chevron-back" size={22} color={colors.primary[700]} />
            <Text className="font-semibold text-primary-700">Voltar</Text>
          </Pressable>

          <Text className="text-3xl font-extrabold text-primary-900">Criar conta</Text>
          <Text className="mb-8 mt-1 text-base text-fg-muted">
            Junte-se ao maior marketplace automóvel.
          </Text>

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
              placeholder="Mínimo 6 caracteres"
              secureTextEntry
              autoComplete="password-new"
            />
            <Button label="Criar conta" onPress={handleRegistar} loading={loading} />
          </View>

          <View className="mt-8 flex-row justify-center">
            <Text className="text-fg-muted">Já tem conta? </Text>
            <Link href="/login" asChild>
              <Pressable>
                <Text className="font-bold text-primary-700">Entrar</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
