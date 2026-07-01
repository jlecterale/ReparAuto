import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ChipSelect } from '@/components/ui/ChipSelect';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { addReport } from '@/lib/trust';
import { MOTIVO_REPORT_LABELS, type MotivoReport, type TipoReport } from '@/types';

const MOTIVOS = (Object.keys(MOTIVO_REPORT_LABELS) as MotivoReport[]).map((m) => ({
  value: m,
  label: MOTIVO_REPORT_LABELS[m],
}));

export default function DenunciarScreen() {
  const { alvoId, alvoTipo, titulo } = useLocalSearchParams<{
    alvoId: string;
    alvoTipo: TipoReport;
    titulo?: string;
  }>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [motivo, setMotivo] = useState<MotivoReport>('fraude');
  const [descricao, setDescricao] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    if (!user) {
      router.replace('/login');
      return;
    }
    setEnviando(true);
    try {
      await addReport({
        denuncianteUid: user.uid,
        denuncianteEmail: user.email,
        alvoId,
        alvoTipo,
        motivo,
        descricao: descricao.trim(),
      });
      Alert.alert(
        'Denúncia enviada',
        'Obrigado. A nossa equipa vai analisar este anúncio.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch {
      showToast('Não foi possível enviar a denúncia.', 'error');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-neutral-50" contentContainerClassName="p-4 gap-4">
      {!!titulo && (
        <Text className="text-fg-muted">
          A denunciar: <Text className="font-semibold text-fg">{titulo}</Text>
        </Text>
      )}
      <ChipSelect label="Motivo" options={MOTIVOS} value={motivo} onChange={setMotivo} />
      <Input
        label="Descrição"
        value={descricao}
        onChangeText={setDescricao}
        placeholder="Descreva o problema (opcional)…"
        multiline
        numberOfLines={4}
        className="h-28"
        style={{ textAlignVertical: 'top' }}
      />
      <View className="rounded-xl bg-warning-50 p-3">
        <Text className="text-xs text-warning-800">
          As denúncias são confidenciais e analisadas pela equipa. O uso abusivo
          pode levar à suspensão da conta.
        </Text>
      </View>
      <Button
        label={enviando ? 'A enviar…' : 'Enviar denúncia'}
        variant="secondary"
        onPress={enviar}
        loading={enviando}
      />
    </ScrollView>
  );
}
