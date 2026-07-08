import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '@/components/ui/Button';
import { ChipSelect } from '@/components/ui/ChipSelect';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useEmailVerification } from '@/hooks/useEmailVerification';
import { useVerification } from '@/hooks/useVerification';
import { uploadVerificationFile } from '@/lib/db';
import { verificationTipoForConta } from '@/lib/verification';
import { colors } from '@/theme/colors';
import { TIPO_DOCUMENTO_LABELS, type TipoDocumento } from '@/types';

const MAX_BYTES = 5 * 1024 * 1024;

const TIPOS_DOCUMENTO = (Object.keys(TIPO_DOCUMENTO_LABELS) as TipoDocumento[]).map((value) => ({
  value,
  label: TIPO_DOCUMENTO_LABELS[value],
}));

type Slot = 'documento' | 'selfie';

export default function VerificarContaScreen() {
  const { user, emailVerified } = useAuth();
  const { showToast } = useToast();
  const { verification, loading, pedir } = useVerification(user?.uid);

  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>('cc');
  const [docUri, setDocUri] = useState<string | null>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Fixed by the account type — professional accounts do a professional
  // verification, everyone else an identity one. Not chosen here.
  const tipo = verificationTipoForConta(user?.tipoConta);

  function escolher(slot: Slot) {
    Alert.alert(
      slot === 'selfie' ? 'Selfie com o documento' : 'Foto do documento',
      'Como quer adicionar a imagem?',
      [
        { text: 'Câmara', onPress: () => capturar(slot, 'camera') },
        { text: 'Galeria', onPress: () => capturar(slot, 'galeria') },
        { text: 'Cancelar', style: 'cancel' },
      ],
    );
  }

  async function capturar(slot: Slot, origem: 'camera' | 'galeria') {
    try {
      let result: ImagePicker.ImagePickerResult;
      if (origem === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permissão necessária', 'Autorize o acesso à câmara nas Definições.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          cameraType: slot === 'selfie' ? ImagePicker.CameraType.front : ImagePicker.CameraType.back,
          quality: 0.6,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
      }
      if (result.canceled) return;
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > MAX_BYTES) {
        showToast('A imagem deve ter no máximo 5MB.', 'error');
        return;
      }
      if (slot === 'documento') setDocUri(asset.uri);
      else setSelfieUri(asset.uri);
    } catch {
      showToast('Não foi possível obter a imagem.', 'error');
    }
  }

  async function submeter() {
    if (!user || !docUri || !selfieUri) return;
    setEnviando(true);
    try {
      const [documentoUrl, selfieUrl] = await Promise.all([
        uploadVerificationFile(user.uid, docUri, 'documento'),
        uploadVerificationFile(user.uid, selfieUri, 'selfie'),
      ]);
      await pedir({
        uid: user.uid,
        email: user.email,
        nome: user.nome,
        tipo,
        tipoDocumento,
        documentoUrl,
        selfieUrl,
        nif: user.nif || undefined,
        status: 'pendente',
      });
      showToast('Pedido de verificação enviado.', 'success');
    } catch {
      showToast('Não foi possível enviar o pedido. Tente novamente.', 'error');
    } finally {
      setEnviando(false);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-50">
        <ActivityIndicator size="large" color={colors.primary[600]} />
      </View>
    );
  }

  if (user?.verificado) {
    return (
      <StatusCard
        icon="shield-checkmark"
        tone="success"
        titulo="Conta verificada"
        texto="A sua identidade foi verificada pela equipa RecarGarage."
      />
    );
  }

  if (verification && verification.status !== 'rejeitado') {
    const pendente = verification.status === 'pendente';
    return (
      <StatusCard
        icon={pendente ? 'time-outline' : 'checkmark-circle'}
        tone={pendente ? 'warning' : 'success'}
        titulo={pendente ? 'Verificação em análise' : 'Verificação aprovada'}
        texto={
          pendente
            ? 'O seu pedido está a ser analisado. Os documentos enviados são apagados após a decisão.'
            : 'O seu pedido foi aprovado!'
        }
        nota={verification.notasAdmin}
      />
    );
  }

  if (!emailVerified) {
    return <EmailGuard email={user?.email} />;
  }

  return (
    <ScrollView className="flex-1 bg-neutral-50" contentContainerClassName="p-4 gap-4">
      {verification?.status === 'rejeitado' && (
        <View className="rounded-2xl border border-danger-200 bg-danger-50 p-4">
          <Text className="font-bold text-danger-700">O seu pedido anterior foi recusado.</Text>
          {!!verification.notasAdmin && (
            <Text className="mt-1 text-sm text-danger-700">Motivo: {verification.notasAdmin}</Text>
          )}
          <Text className="mt-1 text-sm text-danger-700">Pode submeter um novo pedido abaixo.</Text>
        </View>
      )}

      <Text className="text-sm text-fg-muted">
        Envie uma foto do seu documento de identificação e uma selfie a segurar o documento para
        obter o selo de conta verificada. Os ficheiros são apagados após a análise.
      </Text>

      {/* Tipo de verificação — determinado pelo tipo de conta, não escolhido aqui */}
      <View className="flex-row items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-3">
        <Ionicons
          name={tipo === 'profissional' ? 'briefcase-outline' : 'person-outline'}
          size={18}
          color={colors.primary[600]}
        />
        <Text className="text-sm font-semibold text-fg">
          {tipo === 'profissional' ? 'Verificação Profissional' : 'Verificação de Identidade'}
        </Text>
      </View>

      <ChipSelect
        label="Tipo de documento"
        options={TIPOS_DOCUMENTO}
        value={tipoDocumento}
        onChange={setTipoDocumento}
      />

      <ImageSlot
        label="Foto do documento"
        uri={docUri}
        onPick={() => escolher('documento')}
        onRemove={() => setDocUri(null)}
      />
      <ImageSlot
        label="Selfie com o documento"
        uri={selfieUri}
        onPick={() => escolher('selfie')}
        onRemove={() => setSelfieUri(null)}
      />

      <Button
        label={enviando ? 'A enviar…' : 'Pedir verificação'}
        onPress={submeter}
        loading={enviando}
        disabled={!docUri || !selfieUri}
        icon={<Ionicons name="paper-plane-outline" size={18} color="#fff" />}
      />

      <View className="flex-row items-center justify-center gap-1.5 px-2">
        <Ionicons name="lock-closed-outline" size={12} color={colors.neutral[500]} />
        <Text className="text-xs text-fg-subtle">
          Os documentos são guardados de forma segura e apagados após a verificação (RGPD).
        </Text>
      </View>
    </ScrollView>
  );
}

function EmailGuard({ email }: { email?: string }) {
  const { reenviar, verificar, resending, checking } = useEmailVerification();
  return (
    <View className="flex-1 bg-neutral-50 p-4">
      <View className="rounded-2xl border border-warning-200 bg-warning-50 p-4">
        <View className="flex-row items-center gap-2">
          <Ionicons name="mail-unread-outline" size={20} color={colors.warning[500]} />
          <Text className="text-base font-bold text-warning-700">Confirme o seu email</Text>
        </View>
        <Text className="mt-1 text-sm text-warning-700">
          Para pedir a verificação da conta precisa de confirmar o seu email
          {email ? ` (${email})` : ''}. Depois de confirmar, toque em “Já confirmei”.
        </Text>
        <View className="mt-4 gap-2">
          <Button label={checking ? 'A verificar…' : 'Já confirmei'} onPress={verificar} loading={checking} />
          <Pressable
            onPress={reenviar}
            disabled={resending}
            accessibilityRole="button"
            className="items-center py-2 active:opacity-70"
          >
            <Text className="text-sm font-semibold text-primary-700">
              {resending ? 'A enviar…' : 'Reenviar email de confirmação'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function ImageSlot({
  label,
  uri,
  onPick,
  onRemove,
}: {
  label: string;
  uri: string | null;
  onPick: () => void;
  onRemove: () => void;
}) {
  return (
    <View>
      <Text className="mb-1.5 text-sm font-semibold text-fg-muted">{label}</Text>
      {uri ? (
        <View className="relative">
          <Image source={uri} style={{ width: '100%', height: 180, borderRadius: 12 }} contentFit="cover" />
          <Pressable
            onPress={onRemove}
            accessibilityRole="button"
            accessibilityLabel="Remover imagem"
            hitSlop={8}
            className="absolute right-2 top-2 h-8 w-8 items-center justify-center rounded-full bg-black/60"
          >
            <Ionicons name="close" size={18} color="#fff" />
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={onPick}
          accessibilityRole="button"
          className="items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 bg-white py-8 active:opacity-80"
        >
          <Ionicons name="cloud-upload-outline" size={26} color={colors.neutral[400]} />
          <Text className="mt-1 text-sm text-fg-muted">Toque para adicionar</Text>
          <Text className="text-xs text-fg-subtle">Câmara ou galeria · até 5MB</Text>
        </Pressable>
      )}
    </View>
  );
}

function StatusCard({
  icon,
  tone,
  titulo,
  texto,
  nota,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tone: 'success' | 'warning';
  titulo: string;
  texto: string;
  nota?: string;
}) {
  const toneCls = tone === 'success' ? 'border-success-200 bg-success-50' : 'border-warning-200 bg-warning-50';
  const textCls = tone === 'success' ? 'text-success-700' : 'text-warning-700';
  const iconColor = tone === 'success' ? colors.success[600] : colors.warning[500];
  return (
    <View className="flex-1 bg-neutral-50 p-4">
      <View className={`rounded-2xl border p-4 ${toneCls}`}>
        <View className="flex-row items-center gap-2">
          <Ionicons name={icon} size={20} color={iconColor} />
          <Text className={`text-base font-bold ${textCls}`}>{titulo}</Text>
        </View>
        <Text className={`mt-1 text-sm ${textCls}`}>{texto}</Text>
        {!!nota && <Text className={`mt-1 text-sm italic ${textCls}`}>Notas: {nota}</Text>}
      </View>
    </View>
  );
}
