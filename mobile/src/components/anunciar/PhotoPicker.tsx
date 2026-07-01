import { useState } from 'react';
import { Alert, Modal, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, {
  ScaleDecorator,
  type RenderItemParams,
} from 'react-native-draggable-flatlist';
import { GuidedSpinCapture } from '@/components/anunciar/GuidedSpinCapture';
import { ImageCropper } from '@/components/anunciar/ImageCropper';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { KeyboardAvoider } from '@/components/ui/KeyboardAvoider';
import { parseExternalImageUrl } from '@/lib/images';
import {
  getCaptureSequence,
  REQUIRED_SPIN_ANGLES,
  SPIN_ANGLE_LABELS,
  SPIN_ANGLE_ORDER,
  type SpinAngle,
} from '@/lib/spin360';
import { colors } from '@/theme/colors';

interface PhotoPickerProps {
  fotos: string[];
  onChange: (fotos: string[]) => void;
  max: number;
  /**
   * Photo URI → tagged vehicle angle. Providing both props turns on the
   * 360-mode tagging UI (an angle chip per photo). Keys follow the photo
   * strings so tags survive reorder; convert with toPhotoAngles on save.
   */
  angleByPhoto?: Record<string, SpinAngle>;
  onAngleByPhotoChange?: (angleByPhoto: Record<string, SpinAngle>) => void;
}

interface PendingCrop {
  uri: string;
  width?: number;
  height?: number;
}

export function PhotoPicker({ fotos, onChange, max, angleByPhoto, onAngleByPhotoChange }: PhotoPickerProps) {
  const restantes = max - fotos.length;
  // Long-press drag to reorder only makes sense with 2+ photos.
  const reordenavel = max > 1 && fotos.length > 1;
  const tagAngles = !!(angleByPhoto && onAngleByPhotoChange);
  const taggedAngles = new Set(Object.values(angleByPhoto ?? {}));
  const missingRequired = REQUIRED_SPIN_ANGLES.filter((a) => !taggedAngles.has(a));
  // Photo whose angle is being picked in the bottom sheet, or null.
  const [anglePickerUri, setAnglePickerUri] = useState<string | null>(null);
  // Guided 360 capture (camera with angle frame overlay).
  const [guidedOpen, setGuidedOpen] = useState(false);

  function setPhotoAngle(foto: string, angle: SpinAngle | null) {
    if (!angleByPhoto || !onAngleByPhotoChange) return;
    const next = { ...angleByPhoto };
    // Each angle belongs to a single photo — retagging steals it.
    for (const [f, a] of Object.entries(next)) {
      if (a === angle || f === foto) delete next[f];
    }
    if (angle) next[foto] = angle;
    onAngleByPhotoChange(next);
  }

  function dropPhotoAngle(foto: string) {
    if (!angleByPhoto || !onAngleByPhotoChange || !(foto in angleByPhoto)) return;
    const next = { ...angleByPhoto };
    delete next[foto];
    onAngleByPhotoChange(next);
  }

  function movePhotoAngle(from: string, to: string) {
    if (!angleByPhoto || !onAngleByPhotoChange) return;
    const angle = angleByPhoto[from];
    if (!angle) return;
    const next = { ...angleByPhoto };
    delete next[from];
    next[to] = angle;
    onAngleByPhotoChange(next);
  }

  function handleGuidedCapture(uri: string, angle: SpinAngle) {
    if (fotos.length >= max || !angleByPhoto || !onAngleByPhotoChange) return;
    onChange([...fotos, uri].slice(0, max));
    onAngleByPhotoChange({ ...angleByPhoto, [uri]: angle });
  }

  // Freshly-picked images awaiting crop, processed one at a time.
  const [queue, setQueue] = useState<PendingCrop[]>([]);
  const [batchTotal, setBatchTotal] = useState(0);
  // Index of an already-added photo being re-cropped, or null.
  const [editIndex, setEditIndex] = useState<number | null>(null);
  // "Add photo" source chooser (camera / gallery / URL). A BottomSheet instead
  // of Alert.alert because Android alerts cap at 3 buttons.
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  // "Add photo by URL" dialog.
  const [urlDialogOpen, setUrlDialogOpen] = useState(false);
  const [urlValue, setUrlValue] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [urlChecking, setUrlChecking] = useState(false);

  function enfileirar(assets: PendingCrop[]) {
    const livres = assets.slice(0, Math.max(0, max - fotos.length));
    if (livres.length === 0) return;
    setBatchTotal(livres.length);
    setQueue(livres);
  }

  async function escolherDaGaleria() {
    // The system Photo Picker (Android 13+ / iOS PHPicker) needs no permission.
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: max > 1,
      selectionLimit: restantes,
      quality: 1,
    });
    if (!result.canceled) {
      enfileirar(result.assets.map((a) => ({ uri: a.uri, width: a.width, height: a.height })));
    }
  }

  async function tirarFoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão necessária', 'Autorize o acesso à câmara nas Definições.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 1 });
    if (!result.canceled) {
      const a = result.assets[0];
      enfileirar([{ uri: a.uri, width: a.width, height: a.height }]);
    }
  }

  function adicionar() {
    if (restantes <= 0) {
      Alert.alert('Limite atingido', `Máximo de ${max} fotos.`);
      return;
    }
    setAddSheetOpen(true);
  }

  // Runs a sheet action only after the sheet Modal has dismissed — presenting
  // the native picker (or another Modal) while it is still animating out fails
  // silently on iOS.
  function runAfterSheetClose(action: () => void) {
    setAddSheetOpen(false);
    setTimeout(action, 350);
  }

  function closeUrlDialog() {
    setUrlDialogOpen(false);
    setUrlValue('');
    setUrlError(null);
    setUrlChecking(false);
  }

  async function addByUrl() {
    const url = parseExternalImageUrl(urlValue);
    if (!url) {
      setUrlError('Insira um URL de imagem válido (começado por https://).');
      return;
    }
    if (fotos.includes(url)) {
      setUrlError('Essa imagem já está no anúncio.');
      return;
    }
    setUrlChecking(true);
    // Confirms the URL actually serves a renderable image before adding it.
    let ok = false;
    try {
      ok = await Image.prefetch(url);
    } catch {
      ok = false;
    }
    setUrlChecking(false);
    if (!ok) {
      setUrlError('Não foi possível carregar uma imagem a partir desse URL.');
      return;
    }
    // URL photos skip the cropper (remote images can't be manipulated locally)
    // and are stored as-is; upload is skipped for http(s) URIs on submit.
    onChange([...fotos, url].slice(0, max));
    closeUrlDialog();
  }

  function avancarFila() {
    setQueue((q) => {
      const resto = q.slice(1);
      if (resto.length === 0) setBatchTotal(0);
      return resto;
    });
  }

  function confirmarNova(uri: string) {
    onChange([...fotos, uri].slice(0, max));
    avancarFila();
  }

  function confirmarEdicao(uri: string) {
    if (editIndex === null) return;
    const antiga = fotos[editIndex];
    // Angle tags follow the photo across a re-crop (the URI changes).
    if (antiga) movePhotoAngle(antiga, uri);
    onChange(fotos.map((f, i) => (i === editIndex ? uri : f)));
    setEditIndex(null);
  }

  function remover(uri: string) {
    dropPhotoAngle(uri);
    onChange(fotos.filter((f) => f !== uri));
  }

  function renderItem({ item: uri, getIndex, drag, isActive }: RenderItemParams<string>) {
    const index = getIndex();
    const isCapa = index === 0;
    const angle = angleByPhoto?.[uri];
    return (
      <ScaleDecorator>
        <Pressable
          onLongPress={reordenavel ? drag : undefined}
          disabled={isActive}
          delayLongPress={150}
          accessibilityRole="image"
          accessibilityLabel={reordenavel ? 'Manter premido para reordenar' : undefined}
          className={`mr-2 ${isActive ? 'opacity-80' : ''}`}
        >
          <Image source={uri} style={{ width: 96, height: 96, borderRadius: 12 }} contentFit="cover" />
          {isCapa && (
            <View className="absolute bottom-1 left-1 rounded bg-primary-900/90 px-1.5 py-0.5">
              <Text className="text-[10px] font-bold text-white">Capa</Text>
            </View>
          )}
          <Pressable
            onPress={() => index !== undefined && setEditIndex(index)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Editar foto"
            className="absolute left-1 top-1 h-6 w-6 items-center justify-center rounded-full bg-black/55"
          >
            <Ionicons name="crop-outline" size={13} color="#fff" />
          </Pressable>
          <Pressable
            onPress={() => remover(uri)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Remover foto"
            className="absolute right-1 top-1 h-6 w-6 items-center justify-center rounded-full bg-danger-600"
          >
            <Ionicons name="close" size={14} color="#fff" />
          </Pressable>
          {tagAngles && (
            <Pressable
              onPress={() => setAnglePickerUri(uri)}
              hitSlop={4}
              accessibilityRole="button"
              accessibilityLabel={angle ? `Ângulo: ${SPIN_ANGLE_LABELS[angle]}` : 'Definir ângulo da foto'}
              className={`mt-1 w-24 flex-row items-center justify-center rounded-lg border px-1 py-1 ${
                angle ? 'border-success-300 bg-success-50' : 'border-neutral-300 bg-white'
              }`}
            >
              <Text
                numberOfLines={1}
                className={`text-[10px] ${angle ? 'font-bold text-success-700' : 'text-fg-subtle'}`}
              >
                {angle ? SPIN_ANGLE_LABELS[angle] : 'Ângulo…'}
              </Text>
            </Pressable>
          )}
        </Pressable>
      </ScaleDecorator>
    );
  }

  return (
    <View>
      <View className="mb-1.5 flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-fg-muted">
          Fotos <Text className="text-danger-600">*</Text>
        </Text>
        <Text className="text-xs text-fg-subtle">
          {fotos.length}/{max}
        </Text>
      </View>

      <DraggableFlatList
        data={fotos}
        horizontal
        keyExtractor={(uri) => uri}
        onDragEnd={({ data }) => onChange(data)}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        activationDistance={12}
        ListHeaderComponent={
          <Pressable
            onPress={adicionar}
            accessibilityRole="button"
            accessibilityLabel="Adicionar foto"
            className="mr-2 h-24 w-24 items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 bg-white"
          >
            <Ionicons name="camera" size={26} color={colors.primary[600]} />
            <Text className="mt-1 text-xs font-semibold text-primary-600">Adicionar</Text>
          </Pressable>
        }
      />

      <Text className="mt-1.5 text-xs text-fg-subtle">
        As fotos são recortadas para a mesma proporção.
        {reordenavel ? ' Mantenha premida uma foto para reordenar; a primeira é a capa.' : ''}
      </Text>

      {tagAngles && (
        <View
          className={`mt-2 rounded-xl border px-3 py-2 ${
            missingRequired.length === 0
              ? 'border-success-200 bg-success-50'
              : 'border-neutral-200 bg-neutral-50'
          }`}
        >
          {missingRequired.length === 0 ? (
            <Text className="text-[11px] font-bold text-success-700">
              ✓ Vista 360° ativa — os compradores vão poder rodar o veículo no anúncio.
            </Text>
          ) : (
            <Text className="text-[11px] text-fg-muted">
              <Text className="font-bold text-fg">
                Vista 360° ({REQUIRED_SPIN_ANGLES.length - missingRequired.length}/{REQUIRED_SPIN_ANGLES.length})
              </Text>
              {' — indique o ângulo de cada foto. Falta marcar: '}
              {missingRequired.map((a) => SPIN_ANGLE_LABELS[a]).join(', ')}.
            </Text>
          )}
          {restantes > 0 && getCaptureSequence(angleByPhoto ?? {}).length > 0 && (
            <Pressable
              onPress={() => setGuidedOpen(true)}
              accessibilityRole="button"
              className="mt-1.5 flex-row items-center gap-1.5 active:opacity-70"
            >
              <Ionicons name="camera-outline" size={14} color={colors.secondary[600]} />
              <Text className="text-[11px] font-bold text-secondary-600">
                Captura guiada 360° — fotografe cada ângulo com moldura
              </Text>
            </Pressable>
          )}
        </View>
      )}

      <BottomSheet visible={addSheetOpen} onClose={() => setAddSheetOpen(false)} title="Adicionar foto">
        <View className="gap-1">
          {(
            [
              { icon: 'camera-outline', label: 'Tirar foto', action: tirarFoto },
              { icon: 'images-outline', label: 'Escolher da galeria', action: escolherDaGaleria },
              { icon: 'link-outline', label: 'Adicionar por URL', action: () => setUrlDialogOpen(true) },
            ] as const
          ).map((opt) => (
            <Pressable
              key={opt.label}
              onPress={() => runAfterSheetClose(opt.action)}
              accessibilityRole="button"
              className="flex-row items-center rounded-xl px-3 py-3.5 active:bg-neutral-100"
            >
              <Ionicons name={opt.icon} size={20} color={colors.primary[600]} style={{ marginRight: 12 }} />
              <Text className="flex-1 text-base text-fg">{opt.label}</Text>
            </Pressable>
          ))}
        </View>
      </BottomSheet>

      <Modal visible={urlDialogOpen} transparent animationType="fade" onRequestClose={closeUrlDialog}>
        <KeyboardAvoider>
          <Pressable
            className="flex-1 items-center justify-center bg-black/40 px-5"
            onPress={closeUrlDialog}
            accessibilityLabel="Fechar"
          >
            {/* Inner Pressable stops backdrop presses from closing the dialog. */}
            <Pressable className="w-full rounded-2xl bg-white p-5" onPress={() => {}}>
              <Text className="mb-1 text-lg font-extrabold text-fg-heading">Adicionar por URL</Text>
              <Text className="mb-3 text-sm text-fg-muted">
                Cole o endereço de uma imagem pública (https).
              </Text>
              <Input
                value={urlValue}
                onChangeText={(t) => {
                  setUrlValue(t);
                  setUrlError(null);
                }}
                error={urlError ?? undefined}
                placeholder="https://exemplo.com/foto.jpg"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                autoFocus
                onSubmitEditing={addByUrl}
              />
              <View className="mt-4 flex-row gap-3">
                <Button label="Cancelar" variant="outline" onPress={closeUrlDialog} className="flex-1" />
                <Button
                  label="Adicionar"
                  onPress={addByUrl}
                  loading={urlChecking}
                  disabled={!urlValue.trim()}
                  className="flex-1"
                />
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoider>
      </Modal>

      <BottomSheet
        visible={anglePickerUri !== null}
        onClose={() => setAnglePickerUri(null)}
        title="Ângulo da foto"
      >
        <View className="gap-1">
          {anglePickerUri && (
            <View className="mb-2 flex-row items-center gap-3">
              <Image
                source={anglePickerUri}
                style={{ width: 56, height: 56, borderRadius: 10 }}
                contentFit="cover"
              />
              <Text className="flex-1 text-xs text-fg-muted">
                Marque a frente, a traseira e as duas laterais para ativar a vista 360°.
              </Text>
            </View>
          )}
          {SPIN_ANGLE_ORDER.map((angle) => {
            const current = anglePickerUri ? angleByPhoto?.[anglePickerUri] === angle : false;
            const takenElsewhere = !current && taggedAngles.has(angle);
            return (
              <Pressable
                key={angle}
                onPress={() => {
                  if (anglePickerUri) setPhotoAngle(anglePickerUri, current ? null : angle);
                  setAnglePickerUri(null);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: current }}
                className={`flex-row items-center rounded-xl px-3 py-2.5 active:bg-neutral-100 ${
                  current ? 'bg-success-50' : ''
                }`}
              >
                <Text className={`flex-1 text-base ${current ? 'font-bold text-success-700' : 'text-fg'}`}>
                  {SPIN_ANGLE_LABELS[angle]}
                </Text>
                {current && <Ionicons name="checkmark" size={18} color={colors.success[600]} />}
                {takenElsewhere && (
                  <Text className="text-[10px] text-fg-subtle">noutra foto</Text>
                )}
              </Pressable>
            );
          })}
          {anglePickerUri && angleByPhoto?.[anglePickerUri] && (
            <Pressable
              onPress={() => {
                setPhotoAngle(anglePickerUri, null);
                setAnglePickerUri(null);
              }}
              accessibilityRole="button"
              className="flex-row items-center rounded-xl px-3 py-2.5 active:bg-neutral-100"
            >
              <Text className="flex-1 text-base text-danger-600">Remover ângulo</Text>
            </Pressable>
          )}
        </View>
      </BottomSheet>

      {tagAngles && (
        <GuidedSpinCapture
          visible={guidedOpen}
          angleByPhoto={angleByPhoto ?? {}}
          remainingSlots={restantes}
          onCapture={handleGuidedCapture}
          onClose={() => setGuidedOpen(false)}
        />
      )}

      {editIndex !== null && (
        <ImageCropper
          uri={fotos[editIndex]}
          titulo="Editar foto"
          onCancel={() => setEditIndex(null)}
          onConfirm={confirmarEdicao}
        />
      )}
      {editIndex === null && queue.length > 0 && (
        <ImageCropper
          key={queue[0].uri}
          uri={queue[0].uri}
          width={queue[0].width}
          height={queue[0].height}
          titulo={batchTotal > 1 ? `Foto ${batchTotal - queue.length + 1} de ${batchTotal}` : 'Ajustar foto'}
          onCancel={avancarFila}
          onConfirm={confirmarNova}
        />
      )}
    </View>
  );
}
