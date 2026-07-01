import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, G, Rect } from 'react-native-svg';
import { LISTING_PHOTO_ASPECT } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import {
  getCaptureSequence,
  REQUIRED_SPIN_ANGLES,
  SPIN_ANGLE_DEGREES,
  SPIN_ANGLE_LABELS,
  type SpinAngle,
} from '@/lib/spin360';
import { colors } from '@/theme/colors';

const OUTPUT_WIDTH = 1600;

interface GuidedSpinCaptureProps {
  visible: boolean;
  /** Current form tags — angles already photographed are skipped. */
  angleByPhoto: Record<string, SpinAngle>;
  /** How many photos can still be added to the listing. */
  remainingSlots: number;
  onCapture: (uri: string, angle: SpinAngle) => void;
  onClose: () => void;
}

/** Top-view diagram showing where to stand relative to the vehicle. */
function CapturePositionDiagram({ angle }: { angle: SpinAngle }) {
  const rad = (SPIN_ANGLE_DEGREES[angle] * Math.PI) / 180;
  const cx = 48 + 34 * Math.sin(rad);
  const cy = 48 - 34 * Math.cos(rad);
  return (
    <Svg viewBox="0 0 96 96" width={72} height={72}>
      {/* Walk-around ring */}
      <Circle cx={48} cy={48} r={34} stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} strokeDasharray="3 4" fill="none" />
      {/* Vehicle, top view, nose up */}
      <Rect x={36} y={26} width={24} height={44} rx={9} fill="rgba(255,255,255,0.25)" stroke="rgba(255,255,255,0.7)" strokeWidth={1.5} />
      <Rect x={39} y={36} width={18} height={9} rx={3} fill="rgba(255,255,255,0.5)" />
      {/* Camera position */}
      <G>
        <Circle cx={cx} cy={cy} r={6.5} fill={colors.secondary[600]} />
        <Circle cx={cx} cy={cy} r={10} fill="none" stroke={colors.secondary[600]} strokeWidth={1.5} opacity={0.5} />
      </G>
    </Svg>
  );
}

/**
 * Guided 360 capture: walks the seller around the vehicle, one missing angle
 * at a time, with a framing overlay ("moldura") on the live camera preview.
 * Each shot is cropped to the listing aspect and auto-tagged with its angle.
 * (Mirror of the web GuidedSpinCapture; needs expo-camera for the overlay.)
 */
export function GuidedSpinCapture({
  visible,
  angleByPhoto,
  remainingSlots,
  onCapture,
  onClose,
}: GuidedSpinCaptureProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  // The tour is frozen when it opens; skipped angles are not re-offered.
  const [sequence, setSequence] = useState<SpinAngle[]>([]);
  const [step, setStep] = useState(0);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (visible) {
      setSequence(getCaptureSequence(angleByPhoto));
      setStep(0);
      setPreviewUri(null);
      setBusy(false);
    }
    // Recomputing on every tag change would re-offer skipped angles mid-tour.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    if (visible && (remainingSlots <= 0 || (sequence.length > 0 && step >= sequence.length))) {
      onClose();
    }
  }, [visible, remainingSlots, step, sequence.length, onClose]);

  const angle = sequence[step];
  if (!visible || !angle || remainingSlots <= 0) return null;

  const isRequired = REQUIRED_SPIN_ANGLES.includes(angle);
  const frameW = width - 24;
  const frameH = frameW / LISTING_PHOTO_ASPECT;

  async function takePhoto() {
    if (busy || !cameraRef.current) return;
    setBusy(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      // Center-crop to the listing aspect so the saved photo matches the frame.
      const cropW = Math.min(photo.width, Math.round(photo.height * LISTING_PHOTO_ASPECT));
      const cropH = Math.min(photo.height, Math.round(cropW / LISTING_PHOTO_ASPECT));
      const ref = await ImageManipulator.manipulate(photo.uri)
        .crop({
          originX: Math.round((photo.width - cropW) / 2),
          originY: Math.round((photo.height - cropH) / 2),
          width: cropW,
          height: cropH,
        })
        .resize({ width: Math.min(OUTPUT_WIDTH, cropW) })
        .renderAsync();
      const saved = await ref.saveAsync({ format: SaveFormat.JPEG, compress: 0.82 });
      setPreviewUri(saved.uri);
    } catch {
      // Camera hiccup — stay on this angle so the seller can just try again.
    } finally {
      setBusy(false);
    }
  }

  function usePhoto() {
    if (!previewUri) return;
    onCapture(previewUri, angle);
    setPreviewUri(null);
    setStep((s) => s + 1);
  }

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black">
        {/* Top bar */}
        <View
          style={{ marginTop: insets.top + 8 }}
          className="flex-row items-center justify-between px-4"
        >
          <Text className="text-sm font-bold text-white">Captura guiada 360°</Text>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Fechar captura guiada"
            className="h-10 w-10 items-center justify-center rounded-full bg-white/10"
          >
            <Ionicons name="close" size={22} color="#fff" />
          </Pressable>
        </View>

        {/* Camera / preview stage */}
        <View className="flex-1 items-center justify-center">
          {!permission?.granted ? (
            <View className="items-center px-8">
              <Ionicons name="camera-outline" size={44} color={colors.neutral[400]} />
              <Text className="mt-3 text-center text-base font-bold text-white">
                Acesso à câmara necessário
              </Text>
              <Text className="mb-4 mt-1 text-center text-xs text-white/70">
                {permission?.canAskAgain === false
                  ? 'Autorize a câmara nas Definições do dispositivo.'
                  : 'Autorize a câmara para fotografar cada ângulo do veículo.'}
              </Text>
              {permission?.canAskAgain !== false && (
                <Button label="Permitir câmara" onPress={() => requestPermission()} />
              )}
            </View>
          ) : (
            <View
              style={{ width: frameW, height: frameH }}
              className="overflow-hidden rounded-xl"
            >
              {previewUri ? (
                <Image source={previewUri} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              ) : (
                <CameraView ref={cameraRef} style={{ width: '100%', height: '100%' }} facing="back" />
              )}

              {/* Framing overlay ("moldura") */}
              {!previewUri && (
                <View pointerEvents="none" className="absolute inset-0 rounded-xl border-2 border-dashed border-white/50">
                  <View className="absolute left-2 right-2 top-2 flex-row items-start justify-between gap-2">
                    <View className="rounded-lg bg-black/55 px-2.5 py-1.5">
                      <Text className="text-sm font-extrabold text-white">{SPIN_ANGLE_LABELS[angle]}</Text>
                      <Text className="text-[10px] font-semibold text-white/70">
                        {step + 1}/{sequence.length} · {isRequired ? 'Necessário para o 360°' : 'Opcional'}
                      </Text>
                    </View>
                    <CapturePositionDiagram angle={angle} />
                  </View>
                  <View className="absolute bottom-2 left-0 right-0 items-center">
                    <Text className="rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-semibold text-white/80">
                      Enquadre o veículo inteiro na moldura
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Controls */}
        <View style={{ paddingBottom: insets.bottom + 16 }} className="items-center gap-3 px-4">
          {permission?.granted && !previewUri && (
            <>
              <Pressable
                onPress={takePhoto}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel={`Fotografar: ${SPIN_ANGLE_LABELS[angle]}`}
                className="h-16 w-16 items-center justify-center rounded-full border-4 border-neutral-500 bg-white active:opacity-80"
              >
                {busy ? (
                  <ActivityIndicator color={colors.primary[900]} />
                ) : (
                  <Ionicons name="camera" size={28} color={colors.primary[900]} />
                )}
              </Pressable>
              <Pressable
                onPress={() => setStep((s) => s + 1)}
                accessibilityRole="button"
                className="rounded-full bg-white/15 px-4 py-2 active:bg-white/25"
              >
                <Text className="text-xs font-bold text-white">
                  {step + 1 >= sequence.length ? 'Concluir' : 'Saltar este ângulo →'}
                </Text>
              </Pressable>
            </>
          )}
          {permission?.granted && previewUri && (
            <View className="w-full flex-row gap-3">
              <Button
                label="Repetir"
                variant="outline"
                onPress={() => setPreviewUri(null)}
                className="flex-1"
              />
              <Button label="Usar foto" onPress={usePhoto} className="flex-1" />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
