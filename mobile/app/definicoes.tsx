import { Pressable, ScrollView, Text, View } from 'react-native';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { LogoMark } from '@/components/ui/Logo';
import { colors } from '@/theme/colors';

const SITE = 'https://www.recargarage.com';

const LINKS: { label: string; path: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'Política de Privacidade', path: '/privacidade', icon: 'shield-checkmark-outline' },
  { label: 'Termos e Condições', path: '/termos', icon: 'document-text-outline' },
  { label: 'Política de Cookies', path: '/cookies', icon: 'information-circle-outline' },
  { label: 'Segurança e Conselhos', path: '/seguranca', icon: 'lock-closed-outline' },
  { label: 'Perguntas Frequentes', path: '/faq', icon: 'help-circle-outline' },
];

export default function DefinicoesScreen() {
  const versao = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <ScrollView className="flex-1 bg-neutral-50" contentContainerClassName="p-4">
      <View className="items-center py-6">
        <LogoMark size={56} />
        <Text className="mt-3 text-xl font-extrabold text-primary-900">
          Recar<Text className="text-accent">Garage</Text>
        </Text>
        <Text className="text-sm text-fg-subtle">Versão {versao}</Text>
      </View>

      <View className="overflow-hidden rounded-2xl bg-white">
        {LINKS.map((l, i) => (
          <Pressable
            key={l.path}
            onPress={() => WebBrowser.openBrowserAsync(`${SITE}${l.path}`)}
            accessibilityRole="link"
            className={`flex-row items-center px-4 py-4 active:bg-neutral-50 ${
              i < LINKS.length - 1 ? 'border-b border-neutral-100' : ''
            }`}
          >
            <Ionicons name={l.icon} size={20} color={colors.primary[600]} />
            <Text className="ml-3 flex-1 text-base font-medium text-fg">{l.label}</Text>
            <Ionicons name="open-outline" size={16} color={colors.neutral[400]} />
          </Pressable>
        ))}
      </View>

      <Text className="mt-6 text-center text-xs text-fg-subtle">
        © {new Date().getFullYear()} RecarGarage
      </Text>
    </ScrollView>
  );
}
