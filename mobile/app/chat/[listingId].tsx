import { memo, useEffect, useMemo, useState } from 'react';
import { FlatList, Keyboard, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { formatMessageTime } from '@/lib/format';
import type { ListingType, Mensagem } from '@/types';
import { colors } from '@/theme/colors';

export default function ChatScreen() {
  const params = useLocalSearchParams<{
    listingId: string;
    listingType: ListingType;
    listingTitle: string;
    outroUid: string;
    outroNome: string;
  }>();
  const { listingId, listingType, listingTitle, outroUid, outroNome } = params;

  const { user } = useAuth();
  const { getConversa, enviar, marcarLidas } = useChat();
  const insets = useSafeAreaInsets();
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  // Drive the bottom inset straight from the keyboard height. RN's
  // KeyboardAvoidingView leaves residual padding on Android edge-to-edge after
  // the keyboard closes; tracking the height ourselves resets cleanly to 0.
  const [kbHeight, setKbHeight] = useState(0);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) =>
      setKbHeight(e.endCoordinates.height),
    );
    const hide = Keyboard.addListener('keyboardDidHide', () => setKbHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  const tecladoAberto = kbHeight > 0;

  const conversa = useMemo(
    () => getConversa(listingId, outroUid),
    [getConversa, listingId, outroUid],
  );

  // Mark incoming messages as read whenever the thread updates.
  useEffect(() => {
    if (conversa.length) marcarLidas(conversa);
  }, [conversa, marcarLidas]);

  async function handleEnviar() {
    const t = texto.trim();
    if (!t || !user) return;
    setTexto('');
    setEnviando(true);
    try {
      await enviar({
        toUid: outroUid,
        toNome: outroNome,
        listingId,
        listingType,
        listingTitle,
        texto: t,
      });
    } catch {
      setTexto(t); // restore on failure
    } finally {
      setEnviando(false);
    }
  }

  return (
    <View className="flex-1 bg-neutral-50" style={{ paddingBottom: kbHeight }}>
      <Stack.Screen options={{ title: outroNome || 'Conversa' }} />

      <FlatList
        data={[...conversa].reverse()}
        inverted
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 py-3"
        renderItem={({ item }) => <Bolha mensagem={item} meu={item.fromUid === user?.uid} />}
        ListFooterComponent={
          <View className="mb-2 items-center">
            <Text className="rounded-full bg-neutral-200 px-3 py-1 text-xs text-fg-muted">
              {listingTitle}
            </Text>
          </View>
        }
      />

      <View
        className="flex-row items-end gap-2 border-t border-neutral-200 bg-white px-3 pt-2"
        style={{ paddingBottom: tecladoAberto ? 8 : Math.max(insets.bottom, 8) }}
      >
        <TextInput
          value={texto}
          onChangeText={setTexto}
          placeholder="Escreva uma mensagem…"
          placeholderTextColor={colors.neutral[500]}
          multiline
          className="max-h-28 flex-1 rounded-2xl bg-neutral-100 px-4 py-2.5 text-base text-fg"
        />
        <Pressable
          onPress={handleEnviar}
          disabled={!texto.trim() || enviando}
          accessibilityRole="button"
          accessibilityLabel="Enviar"
          className={`h-11 w-11 items-center justify-center rounded-full ${
            texto.trim() && !enviando ? 'bg-primary-600' : 'bg-neutral-300'
          }`}
        >
          <Ionicons name="send" size={18} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const Bolha = memo(function Bolha({ mensagem, meu }: { mensagem: Mensagem; meu: boolean }) {
  const time = formatMessageTime(mensagem.dataCriacao);
  return (
    <View className={`mb-2 max-w-[80%] ${meu ? 'self-end' : 'self-start'}`}>
      <View
        className={`rounded-2xl px-3.5 py-2.5 ${
          meu ? 'rounded-br-md bg-primary-600' : 'rounded-bl-md bg-white'
        }`}
      >
        <Text className={meu ? 'text-base text-white' : 'text-base text-fg'}>
          {mensagem.mensagem}
        </Text>
        {!!time && (
          <Text className={`mt-0.5 self-end text-[11px] ${meu ? 'text-white/70' : 'text-fg-subtle'}`}>
            {time}
          </Text>
        )}
      </View>
    </View>
  );
});
