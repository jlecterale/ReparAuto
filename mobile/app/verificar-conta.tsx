import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { ChipSelect } from '@/components/ui/ChipSelect';
import { useAuth } from '@/context/AuthContext';
import { useCountry } from '@/context/CountryContext';
import { useToast } from '@/context/ToastContext';
import { useEmailVerification } from '@/hooks/useEmailVerification';
import { addVerification, getVerificationByUid, uploadVerificationImage } from '@/lib/db';
import { documentosPermitidos } from '@/lib/verificationDocs';
import { colors } from '@/theme/colors';
import type { TipoDocumento, TipoVerificacao, Verification } from '@/types';

// Storage caps verification images at 5MB; camera originals can exceed that,
// so every pick is downscaled to this width and recompressed before upload.
// Documents stay perfectly readable at this size.
const MAX_IMAGE_WIDTH = 1920;

export default function VerificarContaScreen() {
  const { user, emailVerified } = useAuth();
  const { country } = useCountry();
  const { showToast } = useToast();

  const [verification, setVerification] = useState<Verification | null>(null);
  const [loading, setLoading] = useState(true);

  const [tipo, setTipo] = useState<TipoVerificacao>('identidade');
  // Accepted documents depend on the market and on personal vs. professional
  // verification — see src/lib/verificationDocs.ts.
  const documentos = useMemo(() => documentosPermitidos(country, tipo), [country, tipo]);
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>(documentos[0].value);
  // Keep the selected document valid whenever the market or type changes the list.
  useEffect(() => {
    if (!documentos.some((d) => d.value === tipoDocumento)) setTipoDocumento(documentos[0].value);
  }, [documentos, tipoDocumento]);

  const [docUri, setDocUri] = useState<string | null>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [erro, setErro] = useState('');

  const uid = user?.uid;
  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    getVerificationByUid(uid)
      .catch(() => null)
      .then((v) => {
        if (cancelled) return;
        setVerification(v);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  if (!user) return <Redirect href="/login" />;
  // Creating a verification request (Firestore + Storage) requires a verified
  // email per the security rules — block up front with a clear message.
  if (!emailVerified) return <EmailGate email={user.email} />;

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-50">
        <ActivityIndicator size="large" color={colors.primary[600]} />
      </View>
    );
  }

  if (user.verificado) {
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
    return verification.status === 'aprovado' ? (
      <StatusCard
        icon="shield-checkmark"
        color="success"
        titulo="Verificação aprovada"
        texto="O seu pedido foi aprovado!"
      />
    ) : (
      <StatusCard
        icon="time-outline"
        color="warning"
        titulo="Verificação em análise"
        texto="O seu pedido de verificação está em análise. Os documentos enviados serão apagados após a decisão."
      />
    );
  }

  async function submeter() {
    if (!user || !docUri || !selfieUri) return;
    setEnviando(true);
    setErro('');
    setProgresso(0);
    try {
      const documentoUrl = await uploadVerificationImage(user.uid, docUri, 'documento', (f) =>
        setProgresso(Math.round(f * 50)),
      );
      const selfieUrl = await uploadVerificationImage(user.uid, selfieUri, 'selfie', (f) =>
        setProgresso(50 + Math.round(f * 50)),
      );
      const nova = await addVerification({
        uid: user.uid,
        email: user.email,
        nome: user.nome,
        country,
        tipo,
        tipoDocumento,
        documentoUrl,
        selfieUrl,
        nif: user.nif || undefined,
        status: 'pendente',
      });
      setVerification(nova);
      showToast('Pedido de verificação enviado.', 'success');
    } catch {
      setErro('Erro ao enviar o pedido. Tente novamente.');
    } finally {
      setEnviando(false);
      setProgresso(0);
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

        <View className="mt-4">
          <ChipSelect<TipoVerificacao>
            label="Tipo de verificação"
            options={[
              { value: 'identidade', label: 'Identidade' },
              { value: 'profissional', label: 'Profissional' },
            ]}
            value={tipo}
            onChange={setTipo}
          />
        </View>

        <View className="mt-4">
          <ChipSelect<TipoDocumento>
            label="Tipo de documento"
            options={documentos}
            value={tipoDocumento}
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
              setErro('');
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
              setErro('');
            }}
          />
        </View>

        {!!erro && (
          <View className="mt-3 flex-row items-center">
            <Ionicons name="warning-outline" size={14} color={colors.danger[600]} />
            <Text className="ml-1 text-sm text-danger-600">{erro}</Text>
          </View>
        )}

        {enviando && progresso > 0 && (
          <View className="mt-3">
            <View className="h-1.5 w-full rounded-full bg-neutral-200">
              <View
                className="h-1.5 rounded-full bg-primary-600"
                style={{ width: `${progresso}%` }}
              />
            </View>
            <Text className="mt-1 text-center text-xs text-fg-subtle">
              A enviar… {progresso}%
            </Text>
          </View>
        )}

        <View className="mt-4">
          <Button
            label="Pedir verificação"
            loading={enviando}
            disabled={enviando || !docUri || !selfieUri}
            onPress={submeter}
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
 * Picks are downscaled/recompressed locally so they respect the 5MB Storage
 * rule for `verifications/` before upload.
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

  async function prepare(pickedUri: string, width?: number) {
    setProcessing(true);
    try {
      const targetWidth = width ? Math.min(MAX_IMAGE_WIDTH, width) : MAX_IMAGE_WIDTH;
      const ref = await ImageManipulator.manipulate(pickedUri)
        .resize({ width: targetWidth })
        .renderAsync();
      const saved = await ref.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });
      onChange(saved.uri);
    } catch {
      // Manipulation hiccup — keep the original pick; Storage still enforces 5MB.
      onChange(pickedUri);
    } finally {
      setProcessing(false);
    }
  }

  // Presenting the native picker while the sheet Modal is still animating out
  // fails silently on iOS — same workaround as PhotoPicker.
  function runAfterSheetClose(action: () => void) {
    setSheetOpen(false);
    setTimeout(action, 350);
  }

  async function escolherDaGaleria() {
    // The system Photo Picker (Android 13+ / iOS PHPicker) needs no permission.
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    if (!result.canceled) {
      await prepare(result.assets[0].uri, result.assets[0].width);
    }
  }

  async function tirarFoto() {
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
    if (!result.canceled) {
      await prepare(result.assets[0].uri, result.assets[0].width);
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

      <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} title={label}>
        <View className="gap-1">
          {(
            [
              { icon: 'camera-outline', label: 'Tirar foto', action: tirarFoto },
              { icon: 'images-outline', label: 'Escolher da galeria', action: escolherDaGaleria },
            ] as const
          ).map((opt) => (
            <Pressable
              key={opt.label}
              onPress={() => runAfterSheetClose(opt.action)}
              accessibilityRole="button"
              className="flex-row items-center rounded-xl px-3 py-3.5 active:bg-neutral-100"
            >
              <Ionicons
                name={opt.icon}
                size={20}
                color={colors.primary[600]}
                style={{ marginRight: 12 }}
              />
              <Text className="flex-1 text-base text-fg">{opt.label}</Text>
            </Pressable>
          ))}
        </View>
      </BottomSheet>
    </View>
  );
}

/** Full-screen status card (verified / pending / approved). */
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

/**
 * Inline email-verification block. Unlike the full-screen VerifyEmailGate
 * (which replaces a whole Stack), this renders under the native header of
 * this screen with copy specific to account verification.
 */
function EmailGate({ email }: { email: string }) {
  const { reenviar, verificar, resending, checking } = useEmailVerification();
  return (
    <ScrollView
      className="flex-1 bg-neutral-50"
      contentContainerClassName="flex-grow items-center justify-center px-6 py-8"
    >
      <View className="mb-5 h-20 w-20 items-center justify-center rounded-full bg-warning-50">
        <Ionicons name="mail-unread-outline" size={40} color={colors.warning[500]} />
      </View>
      <Text className="text-center text-2xl font-extrabold text-fg-heading">
        Verifique o seu email
      </Text>
      <Text className="mt-2 text-center text-base leading-relaxed text-fg-muted">
        Para pedir a verificação da conta precisa de confirmar o seu endereço de email ({email}).
        Enviámos-lhe um link de verificação — depois de confirmar, toque em “Já verifiquei”.
      </Text>
      <View className="mt-7 w-full gap-3">
        <Button
          label={checking ? 'A verificar…' : 'Já verifiquei'}
          onPress={verificar}
          loading={checking}
        />
        <Pressable
          onPress={reenviar}
          disabled={resending}
          accessibilityRole="button"
          className="items-center py-2 active:opacity-70"
        >
          <Text className="text-sm font-semibold text-primary-700">
            {resending ? 'A enviar…' : 'Reenviar email de verificação'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
