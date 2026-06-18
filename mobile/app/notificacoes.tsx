import { FlatList, Pressable, Text, View } from 'react-native';
import { Stack, router, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '@/components/ui/EmptyState';
import { useNotificacoes } from '@/context/NotificacoesContext';
import type { Notificacao, TipoNotificacao } from '@/types';
import { colors } from '@/theme/colors';

const ICON: Record<TipoNotificacao, keyof typeof Ionicons.glyphMap> = {
  aprovado: 'checkmark-circle',
  rejeitado: 'close-circle',
  info: 'information-circle',
  mensagem: 'chatbubble-ellipses',
};

const ICON_COLOR: Record<TipoNotificacao, string> = {
  aprovado: colors.success[600],
  rejeitado: colors.danger[600],
  info: colors.primary[600],
  mensagem: colors.primary[600],
};

export default function NotificacoesScreen() {
  const { notificacoes, naoLidas, marcarLida, marcarTodasLidas } = useNotificacoes();

  function abrir(n: Notificacao) {
    marcarLida(n.id);
    if (n.link && n.link.startsWith('/')) router.push(n.link as Href);
  }

  return (
    <View className="flex-1 bg-neutral-50">
      <Stack.Screen
        options={{
          title: 'Notificações',
          headerRight: () =>
            naoLidas > 0 ? (
              <Pressable onPress={marcarTodasLidas} hitSlop={8} accessibilityRole="button">
                <Text className="font-semibold text-primary-700">Ler todas</Text>
              </Pressable>
            ) : null,
        }}
      />
      <FlatList
        data={notificacoes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => abrir(item)}
            accessibilityRole="button"
            className={`flex-row items-start border-b border-neutral-100 px-4 py-3 ${
              item.lida ? 'bg-white' : 'bg-primary-50/40'
            }`}
          >
            <Ionicons name={ICON[item.tipo]} size={22} color={ICON_COLOR[item.tipo]} />
            <View className="ml-3 flex-1">
              <Text className="text-base font-bold text-fg-heading">{item.titulo}</Text>
              <Text className="text-sm text-fg-muted">{item.mensagem}</Text>
            </View>
            {!item.lida && <View className="ml-2 mt-2 h-2.5 w-2.5 rounded-full bg-primary-600" />}
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="notifications-outline"
            titulo="Sem notificações"
            texto="As novidades sobre os seus anúncios e mensagens aparecem aqui."
          />
        }
      />
    </View>
  );
}
