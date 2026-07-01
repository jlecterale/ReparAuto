import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { StarRating } from '@/components/ui/StarRating';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { addReview } from '@/lib/trust';
import type { Review } from '@/types';

export default function AvaliarScreen() {
  const { anuncioId, anuncioTipo, vendedorUid, vendedorEmail, titulo } =
    useLocalSearchParams<{
      anuncioId: string;
      anuncioTipo: Review['anuncioTipo'];
      vendedorUid: string;
      vendedorEmail: string;
      titulo?: string;
    }>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    if (!user) {
      router.replace('/login');
      return;
    }
    if (nota < 1) {
      showToast('Escolha uma classificação.', 'error');
      return;
    }
    setEnviando(true);
    try {
      await addReview({
        autorUid: user.uid,
        autorNome: user.nome,
        autorFoto: user.foto,
        vendedorUid,
        vendedorEmail,
        anuncioId,
        anuncioTipo,
        nota,
        comentario: comentario.trim(),
      });
      Alert.alert(
        'Avaliação enviada',
        'Obrigado! Será publicada após aprovação.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch {
      showToast('Não foi possível enviar a avaliação.', 'error');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-neutral-50" contentContainerClassName="p-4 gap-4">
      {!!titulo && (
        <Text className="text-fg-muted">
          A avaliar: <Text className="font-semibold text-fg">{titulo}</Text>
        </Text>
      )}
      <View className="items-center py-2">
        <StarRating value={nota} onChange={setNota} size={40} />
      </View>
      <Input
        label="Comentário"
        value={comentario}
        onChangeText={setComentario}
        placeholder="Como foi a sua experiência?"
        multiline
        numberOfLines={4}
        className="h-28"
        style={{ textAlignVertical: 'top' }}
      />
      <Button
        label={enviando ? 'A enviar…' : 'Enviar avaliação'}
        onPress={enviar}
        loading={enviando}
      />
    </ScrollView>
  );
}
