import { useCallback } from 'react';
import { Alert, Linking, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { LogoMark } from '@/components/ui/Logo';
import { useAuth } from '@/context/AuthContext';
import { requestNotificationPermission } from '@/lib/push';
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
  const { user, updateProfile } = useAuth();

  // Defaults to on: the user doc seeds `notificacoes: true`.
  const notificacoesOn = user?.notificacoes !== false;

  const onToggleNotificacoes = useCallback(
    async (value: boolean) => {
      // When enabling, make sure the OS permission is actually granted —
      // otherwise the preference is on but nothing would ever arrive.
      if (value) {
        const granted = await requestNotificationPermission();
        if (!granted) {
          Alert.alert(
            'Notificações desativadas',
            'Para receber notificações, ative-as nas definições do sistema.',
            [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Abrir definições', onPress: () => Linking.openSettings() },
            ],
          );
          return; // leave the preference off
        }
      }
      await updateProfile({ notificacoes: value });
    },
    [updateProfile],
  );

  return (
    <ScrollView className="flex-1 bg-neutral-50" contentContainerClassName="p-4">
      <View className="items-center py-6">
        <LogoMark size={56} />
        <Text className="mt-3 text-xl font-extrabold text-primary-900">
          Recar<Text className="text-accent">Garage</Text>
        </Text>
        <Text className="text-sm text-fg-subtle">Versão {versao}</Text>
      </View>

      {user && (
        <View className="mb-4 overflow-hidden rounded-2xl bg-white">
          <View className="flex-row items-center px-4 py-4">
            <Ionicons
              name="notifications-outline"
              size={20}
              color={colors.primary[600]}
            />
            <View className="ml-3 flex-1 pr-3">
              <Text className="text-base font-medium text-fg">Notificações</Text>
              <Text className="text-xs text-fg-subtle">
                Receber alertas de mensagens e dos seus anúncios
              </Text>
            </View>
            <Switch
              value={notificacoesOn}
              onValueChange={onToggleNotificacoes}
              trackColor={{ false: colors.neutral[200], true: colors.primary[300] }}
              thumbColor={notificacoesOn ? colors.primary[600] : colors.neutral[50]}
              ios_backgroundColor={colors.neutral[200]}
            />
          </View>
        </View>
      )}

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
