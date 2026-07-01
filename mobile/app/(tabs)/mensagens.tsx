import { FlatList, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import type { Conversa } from '@/types';
import { colors } from '@/theme/colors';

export default function MensagensScreen() {
  const { isLoggedIn } = useAuth();
  const { conversas } = useChat();

  if (!isLoggedIn) {
    return (
      <Screen>
        <SectionHeader title="Mensagens" />
        <View className="flex-1 items-center justify-center px-8">
          <View className="mb-5 h-20 w-20 items-center justify-center rounded-full bg-primary-50">
            <Ionicons name="chatbubbles-outline" size={42} color={colors.primary[600]} />
          </View>
          <Text className="text-2xl font-extrabold text-fg-heading">As suas mensagens</Text>
          <Text className="mb-6 mt-2 text-center text-base text-fg-muted">
            Inicie sessão para falar com vendedores e oficinas.
          </Text>
          <View className="w-full">
            <Button label="Entrar ou criar conta" onPress={() => router.push('/login')} />
          </View>
        </View>
      </Screen>
    );
  }

  function abrir(c: Conversa) {
    router.push({
      pathname: '/chat/[listingId]',
      params: {
        listingId: c.listingId,
        listingType: c.listingType,
        listingTitle: c.listingTitle,
        outroUid: c.outroUid,
        outroNome: c.outroNome,
      },
    });
  }

  return (
    <Screen>
      <SectionHeader title="Mensagens" />
      <FlatList
        data={conversas}
        keyExtractor={(item) => item.chaveConversa}
        contentContainerClassName="pt-1"
        renderItem={({ item }) => (
          <Pressable
            onPress={() => abrir(item)}
            accessibilityRole="button"
            className="flex-row items-center border-b border-neutral-100 bg-white px-4 py-3 active:bg-neutral-50"
          >
            <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-50">
              <Ionicons name="person" size={22} color={colors.primary[600]} />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-base font-bold text-fg-heading" numberOfLines={1}>
                {item.outroNome || 'Utilizador'}
              </Text>
              <Text className="text-xs text-fg-subtle" numberOfLines={1}>
                {item.listingTitle}
              </Text>
              <Text className="mt-0.5 text-sm text-fg-muted" numberOfLines={1}>
                {item.ultimaMensagem}
              </Text>
            </View>
            {item.naoLidas > 0 && (
              <View className="ml-2 h-6 min-w-6 items-center justify-center rounded-full bg-danger-500 px-1.5">
                <Text className="text-xs font-bold text-white">{item.naoLidas}</Text>
              </View>
            )}
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="chatbubbles-outline"
            titulo="Sem mensagens"
            texto="Contacte um vendedor a partir de um anúncio para começar."
          />
        }
      />
    </Screen>
  );
}
