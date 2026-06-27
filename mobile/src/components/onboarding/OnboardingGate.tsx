import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context/AuthContext';
import { hasSeenOnboarding, markOnboardingSeen } from '@/lib/onboarding';
import { colors } from '@/theme/colors';

interface Intent {
  id: string;
  route: Href;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  /** NativeWind background class for the tinted icon chip. */
  iconWrap: string;
  titulo: string;
  descricao: string;
  /** Line shown in the signup screen once this door is chosen. */
  contexto: string;
  /** Optional spotlight label — flags the differentiating path. */
  destaque?: string;
}

/**
 * Four doors, not a feature parade. Each states the job the visitor came to do
 * and, in one line, what ReparAuto does differently from generic classifieds —
 * so the welcome doubles as the showcase. "Quero comprar" leads to the Intenção
 * de Compra, the standout feature.
 */
const INTENTS: Intent[] = [
  {
    id: 'vender-carro',
    route: '/anunciar/carro',
    icon: 'car-sport',
    iconColor: colors.primary[600],
    iconWrap: 'bg-primary-50',
    titulo: 'Vender o meu carro',
    descricao: 'Anúncio grátis e com selo de confiança.',
    contexto: 'Crie a sua conta para anunciar o seu carro.',
  },
  {
    id: 'vender-peca',
    route: '/anunciar/peca',
    icon: 'construct',
    iconColor: colors.secondary[600],
    iconWrap: 'bg-secondary-50',
    titulo: 'Vender peças',
    descricao: 'Publique e quem procura é avisado na hora.',
    contexto: 'Crie a sua conta para anunciar as suas peças.',
  },
  {
    id: 'oficina',
    route: '/anunciar/oficina',
    icon: 'business',
    iconColor: colors.success[600],
    iconWrap: 'bg-success-50',
    titulo: 'Tenho uma oficina',
    descricao: 'Apareça para quem precisa de mecânico na sua zona.',
    contexto: 'Crie a sua conta para registar a sua oficina.',
  },
  {
    id: 'comprar',
    route: '/anunciar/intencao',
    icon: 'search',
    iconColor: colors.warning[500],
    iconWrap: 'bg-warning-50',
    titulo: 'Quero comprar',
    descricao: 'Diga o que procura e os vendedores vêm até si.',
    contexto: 'Crie a sua conta para criar o seu alerta de procura.',
    destaque: 'Só na ReparAuto',
  },
];

const GRADIENT = [colors.primary[700], colors.primary[800], colors.primary[950]] as const;

/**
 * Anonymous-first welcome. Shows once, on first launch, for visitors without an
 * account; choosing a door opens the signup screen with context and the chosen
 * creation flow as `next`. Success metric: a new account.
 */
export function OnboardingGate() {
  const { loading, isLoggedIn } = useAuth();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (loading) return;
    // Authenticated users never need the welcome; remember that so a later
    // logout in the same install doesn't pop the first-launch tour at them.
    if (isLoggedIn) {
      markOnboardingSeen();
      return;
    }
    let cancelled = false;
    hasSeenOnboarding().then((seen) => {
      if (!cancelled && !seen) setVisible(true);
    });
    return () => {
      cancelled = true;
    };
  }, [loading, isLoggedIn]);

  function dismiss() {
    markOnboardingSeen();
    setVisible(false);
  }

  function selectIntent(intent: Intent) {
    Haptics.selectionAsync().catch(() => {});
    markOnboardingSeen();
    setVisible(false);
    // Carry the chosen flow + context through the signup modal; the auth screen
    // routes straight to `next` once the account is created.
    router.push({
      pathname: '/registar',
      params: { next: String(intent.route), contexto: intent.contexto },
    });
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={dismiss}
    >
      {visible && <StatusBar style="light" />}
      <LinearGradient colors={GRADIENT} style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 }}>
          <View className="flex-row justify-end px-4">
            <Pressable
              onPress={dismiss}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
              hitSlop={8}
              className="h-9 w-9 items-center justify-center rounded-full bg-white/10 active:bg-white/20"
            >
              <Ionicons name="close" size={20} color={colors.white} />
            </Pressable>
          </View>

          <ScrollView contentContainerClassName="flex-grow justify-center px-5 py-4">
            {/* Header */}
            <View className="mb-7 items-center">
              <View className="mb-3 flex-row items-center gap-1.5 rounded-full bg-white/10 px-3 py-1">
                <Ionicons name="sparkles" size={13} color={colors.warning[500]} />
                <Text className="text-xs font-bold text-white">Bem-vindo à ReparAuto</Text>
              </View>
              <Text className="text-center text-3xl font-extrabold text-white">
                O que o traz aqui hoje?
              </Text>
              <Text className="mt-2 text-center text-base text-white/80">
                Escolha um caminho e nós tratamos do resto.
              </Text>
            </View>

            {/* Intent cards */}
            <View className="gap-3">
              {INTENTS.map((intent) => (
                <Pressable
                  key={intent.id}
                  onPress={() => selectIntent(intent)}
                  accessibilityRole="button"
                  className="flex-row items-center rounded-2xl bg-white p-4 shadow-sm active:opacity-90"
                >
                  <View
                    className={`h-12 w-12 items-center justify-center rounded-xl ${intent.iconWrap}`}
                  >
                    <Ionicons name={intent.icon} size={24} color={intent.iconColor} />
                  </View>
                  <View className="ml-3 flex-1">
                    <View className="flex-row flex-wrap items-center gap-2">
                      <Text className="text-base font-bold text-fg-heading">{intent.titulo}</Text>
                      {intent.destaque && (
                        <View className="rounded-full bg-accent px-2 py-0.5">
                          <Text className="text-xs font-bold text-white">{intent.destaque}</Text>
                        </View>
                      )}
                    </View>
                    <Text className="mt-0.5 text-sm text-fg-muted">{intent.descricao}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.neutral[400]} />
                </Pressable>
              ))}
            </View>

            {/* Escape hatch — low-commitment exit that still belongs to the funnel */}
            <Pressable
              onPress={dismiss}
              accessibilityRole="button"
              className="mt-7 self-center px-4 py-2"
            >
              <Text className="text-sm font-semibold text-white/80 underline">
                Só quero ver os anúncios
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </LinearGradient>
    </Modal>
  );
}
