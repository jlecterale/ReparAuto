import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { VerifyEmailGate } from '@/components/auth/VerifyEmailGate';
import { Button } from '@/components/ui/Button';
import { ChipSelect } from '@/components/ui/ChipSelect';
import { EmptyState } from '@/components/ui/EmptyState';
import { PhotoSourceSheet } from '@/components/ui/PhotoSourceSheet';
import { useAuth } from '@/context/AuthContext';
import { useCountry } from '@/context/CountryContext';
import { useToast } from '@/context/ToastContext';
import { addVerification, getVerificationByUid, uploadVerificationImage } from '@/lib/db';
import { documentosPermitidos } from '@/lib/verificationDocs';
import { verificationTipoForConta } from '@/lib/verification';
import { colors } from '@/theme/colors';
import type { TipoDocumento, Verification } from '@/types';

// Storage caps verification images at 5MB; camera originals can exceed that,
// so picks wider than this are downscaled (and every pick is re-encoded as
// JPEG) before upload. Documents stay perfectly readable at this width.
const MAX_IMAGE_WIDTH = 1920;

export default function VerificarContaScreen() {
  const { user, emailVerified } = useAuth();
  const { country } = useCountry();
  const { showToast } = useToast();

  const [verification, setVerification] = useState<Verification | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // The verification type is fixed by the account type — a professional account
  // does a professional verification, everyone else an identity one. It is not
  // chosen here (the account type can't be changed after signup).
  const tipo = verificationTipoForConta(user?.tipoConta);
  // Accepted documents depend on the market and on personal vs. professional
  // verification — see src/lib/verificationDocs.ts. The selection is derived
  // so it stays valid when switching type changes the list.
  const documentos = useMemo(() => documentosPermitidos(country, tipo), [country, tipo]);
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>(documentos[0].value);
  const selectedDocumentType = documentos.some((d) => d.value === tipoDocumento)
    ? tipoDocumento
    : documentos[0].value;

  const [docUri, setDocUri] = useState<string | null>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [submitError, setSubmitError] = useState('');

  const uid = user?.uid;
  // Reading `verifications` requires a verified email (Firestore rules), so
  // only fetch once past the gate — and refetch when the gate clears. A fetch
  // failure must NOT render the blank form (a hidden pending request would
  // allow duplicate submissions); it shows a retry state instead.
  useEffect(() => {
    if (!uid || !emailVerified) return;
    let cancelled = false;
    setLoading(true);
    setLoadFailed(false);
    getVerificationByUid(uid).then(
      (v) => {
        if (cancelled) return;
        setVerification(v);
        setLoading(false);
      },
      () => {
        if (cancelled) return;
        setLoadFailed(true);
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [uid, emailVerified, reloadKey]);

  if (!user) return <Redirect href="/login" />;
  // Creating a verification request (Firestore + Storage) requires a verified
  // email per the security rules — block up front with a clear message.
  if (!emailVerified) {
    return (
      <VerifyEmailGate
        inline
        message="Para pedir a verificação da conta precisa de confirmar o seu endereço de email"
      />
    );
  }

  if (loadFailed) {
    return (
      <EmptyState
        icon="cloud-offline-outline"
        titulo="Sem ligação"
        texto="Não foi possível carregar o estado da sua verificação."
        action={{ label: 'Tentar novamente', onPress: () => setReloadKey((k) => k + 1) }}
      />
    );
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-50">
        <ActivityIndicator size="large" color={colors.primary[600]} />
      </View>
    );
  }

  if (user.verificado || verification?.status === 'aprovado') {
    return (
      <StatusCard
        icon="shield-checkmark"
        color="success"
        titulo="Conta verificada"
        texto="A sua identidade foi verificada pela equipa RecarGarage."
      />
    );
  }

  if (verification && verification.status !== 'rejeitado') {
    return (
      <StatusCard
        icon="time-outline"
        color="warning"
        titulo="Verificação em análise"
        texto="O seu pedido de verificação está em análise. Os documentos enviados serão apagados após a decisão."
      />
    );
  }

  async function handleSubmit() {
    if (!user || !docUri || !selfieUri) return;
    setSending(true);
    setSubmitError('');
    setProgress(0);
    try {
      // The two uploads are independent — run them in parallel and combine
      // their fractions into one progress value.
      const fractions = { documento: 0, selfie: 0 };
      const report = () =>
        setProgress(Math.round((fractions.documento + fractions.selfie) * 50));
      const [documentoUrl, selfieUrl] = await Promise.all([
        uploadVerificationImage(user.uid, docUri, 'documento', (f) => {
          fractions.documento = f;
          report();
        }),
        uploadVerificationImage(user.uid, selfieUri, 'selfie', (f) => {
          fractions.selfie = f;
          report();
        }),
      ]);
      const created = await addVerification({
        uid: user.uid,
        email: user.email,
        nome: user.nome,
        country,
        tipo,
        tipoDocumento: selectedDocumentType,
        documentoUrl,
        selfieUrl,
        nif: user.nif || undefined,
        status: 'pendente',
      });
      setVerification(created);
      showToast('Pedido de verificação enviado.', 'success');
    } catch {
      setSubmitError('Erro ao enviar o pedido. Tente novamente.');
    } finally {
      setSending(false);
      setProgress(0);
    }
  }

  return (
    <ScrollView className="flex-1 bg-neutral-50" contentContainerClassName="p-4 pb-10">
      {verification?.status === 'rejeitado' && (
        <View className="mb-4 rounded-2xl border border-danger-200 bg-danger-50 p-4">
          <View className="flex-row items-center">
            <Ionicons name="close-circle" size={18} color={colors.danger[600]} />
            <Text className="ml-2 flex-1 font-bold text-danger-700">
              O seu pedido anterior foi rejeitado.
            </Text>
          </View>
          {!!verification.notasAdmin && (
            <Text className="mt-1 text-sm italic text-danger-700/80">
              Motivo: {verification.notasAdmin}
            </Text>
          )}
          <Text className="mt-1 text-sm text-danger-700">Pode submeter um novo pedido abaixo.</Text>
        </View>
      )}

      <View className="rounded-2xl bg-white p-4">
        <View className="flex-row items-center">
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary[600]} />
          <Text className="ml-2 text-base font-bold text-fg-heading">Verificar conta</Text>
        </View>
        <Text className="mt-1 text-sm text-fg-muted">
          Envie um documento de identificação e uma foto sua com o documento para obter o selo de
          conta verificada. Os ficheiros são apagados após a análise.
        </Text>

        {/* Tipo de verificação — determinado pelo tipo de conta, não escolhido aqui */}
        <View className="mt-4 flex-row items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-3">
          <Ionicons
            name={tipo === 'profissional' ? 'briefcase-outline' : 'person-outline'}
            size={18}
            color={colors.primary[600]}
          />
          <Text className="text-sm font-semibold text-fg">
            {tipo === 'profissional' ? 'Verificação Profissional' : 'Verificação de Identidade'}
          </Text>
        </View>

        <View className="mt-4">
          <ChipSelect<TipoDocumento>
            label="Tipo de documento"
            options={documentos}
            value={selectedDocumentType}
            onChange={setTipoDocumento}
          />
        </View>

        <View className="mt-4">
          <DocumentPhotoField
            label="Foto do documento"
            hint="Fotografe o documento num local bem iluminado."
            uri={docUri}
            cameraFacing="back"
            onChange={(uri) => {
              setDocUri(uri);
              setSubmitError('');
            }}
          />
        </View>

        <View className="mt-4">
          <DocumentPhotoField
            label="Selfie com o documento"
            hint="Tire uma selfie segurando o documento junto ao rosto."
            uri={selfieUri}
            cameraFacing="front"
            onChange={(uri) => {
              setSelfieUri(uri);
              setSubmitError('');
            }}
          />
        </View>

        {!!submitError && (
          <View className="mt-3 flex-row items-center">
            <Ionicons name="warning-outline" size={14} color={colors.danger[600]} />
            <Text className="ml-1 text-sm text-danger-600">{submitError}</Text>
          </View>
        )}

        {sending && progress > 0 && (
          <View className="mt-3">
            <View className="h-1.5 w-full rounded-full bg-neutral-200">
              <View
                className="h-1.5 rounded-full bg-primary-600"
                style={{ width: `${progress}%` }}
              />
            </View>
            <Text className="mt-1 text-center text-xs text-fg-subtle">A enviar… {progress}%</Text>
          </View>
        )}

        <View className="mt-4">
          <Button
            label="Pedir verificação"
            loading={sending}
            disabled={sending || !docUri || !selfieUri}
            onPress={handleSubmit}
            icon={<Ionicons name="paper-plane-outline" size={18} color="#fff" />}
          />
        </View>

        <View className="mt-3 flex-row items-center justify-center">
          <Ionicons name="lock-closed-outline" size={12} color={colors.fg.subtle} />
          <Text className="ml-1 text-xs text-fg-subtle">
            Documentos armazenados de forma segura e apagados após a verificação (
            {country === 'BR' ? 'LGPD' : 'RGPD'}).
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

/**
 * One photo input (document or selfie): a tappable dashed box that opens a
 * camera/gallery sheet, then shows the picked image with a remove action.
 * Picks are downscaled/re-encoded locally so they respect the 5MB Storage
 * rule for `verifications/`; a pick that cannot be processed is rejected
 * with an alert instead of being uploaded raw (which the rules would deny
 * with an unexplainable generic error at submit time).
 */
function DocumentPhotoField({
  label,
  hint,
  uri,
  cameraFacing,
  onChange,
}: {
  label: string;
  hint: string;
  uri: string | null;
  /** 'back' to shoot the document, 'front' for the selfie. */
  cameraFacing: 'front' | 'back';
  onChange: (uri: string | null) => void;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  async function prepare(asset: { uri: string; width?: number }) {
    setProcessing(true);
    try {
      let context = ImageManipulator.manipulate(asset.uri);
      // Only resize when the pick is wider than the cap (or its width is
      // unknown) — resize() scales to the exact width, so an unconditional
      // call would upscale smaller images.
      if (!asset.width || asset.width > MAX_IMAGE_WIDTH) {
        context = context.resize({ width: MAX_IMAGE_WIDTH });
      }
      const image = await context.renderAsync();
      const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });
      onChange(saved.uri);
    } catch {
      Alert.alert('Foto não suportada', 'Não foi possível processar a imagem. Tente outra foto.');
    } finally {
      setProcessing(false);
    }
  }

  async function takePhoto() {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permissão necessária', 'Autorize o acesso à câmara nas Definições.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        quality: 1,
        cameraType:
          cameraFacing === 'front' ? ImagePicker.CameraType.front : ImagePicker.CameraType.back,
      });
      if (!result.canceled) await prepare(result.assets[0]);
    } catch {
      Alert.alert('Câmara indisponível', 'Não foi possível abrir a câmara. Tente novamente.');
    }
  }

  async function pickFromGallery() {
    try {
      // The system Photo Picker (Android 13+ / iOS PHPicker) needs no permission.
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
      });
      if (!result.canceled) await prepare(result.assets[0]);
    } catch {
      Alert.alert('Galeria indisponível', 'Não foi possível abrir a galeria. Tente novamente.');
    }
  }

  return (
    <View>
      <Text className="mb-1.5 text-sm font-semibold text-fg-muted">{label}</Text>
      {uri ? (
        <View>
          <Image
            source={uri}
            style={{ width: '100%', height: 160, borderRadius: 12 }}
            contentFit="cover"
          />
          <Pressable
            onPress={() => onChange(null)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Remover foto"
            className="absolute right-2 top-2 h-7 w-7 items-center justify-center rounded-full bg-danger-600"
          >
            <Ionicons name="close" size={16} color="#fff" />
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={() => setSheetOpen(true)}
          disabled={processing}
          accessibilityRole="button"
          accessibilityLabel={label}
          className="items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 bg-white px-4 py-6 active:bg-neutral-50"
        >
          {processing ? (
            <ActivityIndicator color={colors.primary[600]} />
          ) : (
            <>
              <Ionicons name="camera" size={26} color={colors.primary[600]} />
              <Text className="mt-1 text-sm font-semibold text-primary-600">Adicionar foto</Text>
              <Text className="mt-0.5 text-center text-xs text-fg-subtle">{hint}</Text>
            </>
          )}
        </Pressable>
      )}

      <PhotoSourceSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={label}
        options={[
          { icon: 'camera-outline', label: 'Tirar foto', action: takePhoto },
          { icon: 'images-outline', label: 'Escolher da galeria', action: pickFromGallery },
        ]}
      />
    </View>
  );
}

/** Full-screen status card (verified / pending). */
function StatusCard({
  icon,
  color,
  titulo,
  texto,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: 'success' | 'warning';
  titulo: string;
  texto: string;
}) {
  const tint = color === 'success' ? colors.success[600] : colors.warning[500];
  return (
    <View className="flex-1 items-center justify-center bg-neutral-50 px-8">
      <View
        className={`mb-5 h-20 w-20 items-center justify-center rounded-full ${
          color === 'success' ? 'bg-success-100' : 'bg-warning-50'
        }`}
      >
        <Ionicons name={icon} size={40} color={tint} />
      </View>
      <Text className="text-center text-2xl font-extrabold text-fg-heading">{titulo}</Text>
      <Text className="mt-2 text-center text-base leading-relaxed text-fg-muted">{texto}</Text>
    </View>
  );
}
