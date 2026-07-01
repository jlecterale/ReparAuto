import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image as RNImage,
  Modal,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { LISTING_PHOTO_ASPECT } from '@/lib/constants';
import { colors } from '@/theme/colors';

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const OUTPUT_WIDTH = 1600;
const FRAME_PADDING = 16;

const AnimatedImage = Animated.createAnimatedComponent(Image);

interface ImageCropperProps {
  uri: string;
  /** Source pixel dimensions, when known from the picker — avoids a getSize round-trip. */
  width?: number;
  height?: number;
  /** Target aspect ratio (width / height). Defaults to the listing standard 4:3. */
  aspect?: number;
  titulo?: string;
  onCancel: () => void;
  onConfirm: (uri: string) => void;
}

/**
 * Full-screen crop editor: pan + pinch-zoom and 90° rotation over a fixed-ratio
 * frame, producing a cropped JPEG via expo-image-manipulator. Rotation is applied
 * by re-rendering the working image so the crop math only ever deals with an
 * upright picture — keeping it identical to the web cropper's model.
 */
export function ImageCropper({
  uri,
  width,
  height,
  aspect = LISTING_PHOTO_ASPECT,
  titulo,
  onCancel,
  onConfirm,
}: ImageCropperProps) {
  const { width: screenW } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const frameW = screenW - FRAME_PADDING * 2;
  const frameH = Math.round(frameW / aspect);

  // The upright working image (already rotated); crops/rotations write new files.
  const [workingUri, setWorkingUri] = useState(uri);
  const [src, setSrc] = useState<{ w: number; h: number } | null>(
    width && height ? { w: width, h: height } : null,
  );
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);

  // Resolve source dimensions when the picker didn't provide them.
  useEffect(() => {
    if (src) return;
    let alive = true;
    RNImage.getSize(
      uri,
      (w, h) => alive && setSrc({ w, h }),
      () => alive && setErro('Não foi possível carregar a imagem.'),
    );
    return () => {
      alive = false;
    };
  }, [uri, src]);

  // Cover-fit size of the working image inside the frame at zoom 1.
  const baseScale = src ? Math.max(frameW / src.w, frameH / src.h) : 1;
  const baseW = src ? src.w * baseScale : frameW;
  const baseH = src ? src.h * baseScale : frameH;

  const resetTransform = () => {
    scale.value = 1;
    savedScale.value = 1;
    tx.value = 0;
    ty.value = 0;
    savedTx.value = 0;
    savedTy.value = 0;
  };

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .onUpdate((e) => {
          const maxX = Math.max(0, (baseW * scale.value - frameW) / 2);
          const maxY = Math.max(0, (baseH * scale.value - frameH) / 2);
          tx.value = Math.min(maxX, Math.max(-maxX, savedTx.value + e.translationX));
          ty.value = Math.min(maxY, Math.max(-maxY, savedTy.value + e.translationY));
        })
        .onEnd(() => {
          savedTx.value = tx.value;
          savedTy.value = ty.value;
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [baseW, baseH, frameW, frameH],
  );

  const pinch = useMemo(
    () =>
      Gesture.Pinch()
        .onUpdate((e) => {
          scale.value = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, savedScale.value * e.scale));
        })
        .onEnd(() => {
          const maxX = Math.max(0, (baseW * scale.value - frameW) / 2);
          const maxY = Math.max(0, (baseH * scale.value - frameH) / 2);
          tx.value = Math.min(maxX, Math.max(-maxX, tx.value));
          ty.value = Math.min(maxY, Math.max(-maxY, ty.value));
          savedScale.value = scale.value;
          savedTx.value = tx.value;
          savedTy.value = ty.value;
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [baseW, baseH, frameW, frameH],
  );

  const gesture = Gesture.Simultaneous(pan, pinch);

  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  const zoomBy = (factor: number) => {
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, savedScale.value * factor));
    scale.value = next;
    savedScale.value = next;
    const maxX = Math.max(0, (baseW * next - frameW) / 2);
    const maxY = Math.max(0, (baseH * next - frameH) / 2);
    tx.value = savedTx.value = Math.min(maxX, Math.max(-maxX, tx.value));
    ty.value = savedTy.value = Math.min(maxY, Math.max(-maxY, ty.value));
  };

  const rotate = async (dir: 1 | -1) => {
    if (busy || !src) return;
    setBusy(true);
    try {
      const ref = await ImageManipulator.manipulate(workingUri).rotate(dir * 90).renderAsync();
      const saved = await ref.saveAsync({ format: SaveFormat.JPEG, compress: 1 });
      setWorkingUri(saved.uri);
      setSrc({ w: saved.width, h: saved.height });
      resetTransform();
    } catch {
      setErro('Não foi possível rodar a imagem.');
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (busy || !src) return;
    setBusy(true);
    try {
      const s = baseScale * scale.value; // screen px per source px
      const cropW = frameW / s;
      const cropH = frameH / s;
      const centerX = src.w / 2 - tx.value / s;
      const centerY = src.h / 2 - ty.value / s;
      // Round the origin first, then bound the size to the pixels that remain, so
      // originX + width can never exceed the source (native crop rejects an
      // out-of-bounds rect, and independent rounding could overflow by 1px).
      const originX = Math.round(Math.min(Math.max(0, centerX - cropW / 2), Math.max(0, src.w - cropW)));
      const originY = Math.round(Math.min(Math.max(0, centerY - cropH / 2), Math.max(0, src.h - cropH)));

      const ref = await ImageManipulator.manipulate(workingUri)
        .crop({
          originX,
          originY,
          width: Math.min(Math.round(cropW), src.w - originX),
          height: Math.min(Math.round(cropH), src.h - originY),
        })
        .resize({ width: OUTPUT_WIDTH })
        .renderAsync();
      const saved = await ref.saveAsync({ format: SaveFormat.JPEG, compress: 0.82 });
      onConfirm(saved.uri);
    } catch {
      setErro('Não foi possível recortar a imagem.');
      setBusy(false);
    }
  };

  const ready = !!src && !erro;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)' }}>
        <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}>
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-3">
            <Text className="text-base font-bold text-white">{titulo || 'Ajustar foto'}</Text>
            <Pressable
              onPress={onCancel}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Fechar editor"
              className="h-9 w-9 items-center justify-center rounded-full bg-white/15"
            >
              <Ionicons name="close" size={20} color="#fff" />
            </Pressable>
          </View>

          {/* Crop stage */}
          <View className="flex-1 items-center justify-center px-4">
            <GestureDetector gesture={gesture}>
              <View
                style={{ width: frameW, height: frameH }}
                className="overflow-hidden rounded-xl bg-black"
              >
                {ready && (
                  <AnimatedImage
                    source={workingUri}
                    contentFit="fill"
                    style={[
                      {
                        position: 'absolute',
                        width: baseW,
                        height: baseH,
                        left: (frameW - baseW) / 2,
                        top: (frameH - baseH) / 2,
                      },
                      imageStyle,
                    ]}
                  />
                )}
                {/* Rule-of-thirds guides */}
                {ready && (
                  <View pointerEvents="none" className="absolute inset-0">
                    <View style={{ position: 'absolute', top: 0, bottom: 0, left: frameW / 3, width: 1, backgroundColor: 'rgba(255,255,255,0.25)' }} />
                    <View style={{ position: 'absolute', top: 0, bottom: 0, left: (frameW * 2) / 3, width: 1, backgroundColor: 'rgba(255,255,255,0.25)' }} />
                    <View style={{ position: 'absolute', left: 0, right: 0, top: frameH / 3, height: 1, backgroundColor: 'rgba(255,255,255,0.25)' }} />
                    <View style={{ position: 'absolute', left: 0, right: 0, top: (frameH * 2) / 3, height: 1, backgroundColor: 'rgba(255,255,255,0.25)' }} />
                  </View>
                )}
                {(busy || !ready) && (
                  <View className="absolute inset-0 items-center justify-center">
                    <ActivityIndicator color="#fff" />
                  </View>
                )}
              </View>
            </GestureDetector>

            {erro ? (
              <Text className="mt-3 text-center text-sm text-danger-500">{erro}</Text>
            ) : (
              <Text className="mt-3 text-center text-xs text-white/60">
                Arraste para mover · use dois dedos para ampliar
              </Text>
            )}

            {/* Tools */}
            <View className="mt-4 flex-row items-center justify-center gap-2">
              <ToolButton icon="refresh-outline" label="Rodar" flip onPress={() => rotate(-1)} disabled={busy || !ready} />
              <ToolButton icon="refresh-outline" label="Rodar" onPress={() => rotate(1)} disabled={busy || !ready} />
              <ToolButton icon="remove-outline" label="Reduzir" onPress={() => zoomBy(1 / 1.2)} disabled={busy || !ready} />
              <ToolButton icon="add-outline" label="Ampliar" onPress={() => zoomBy(1.2)} disabled={busy || !ready} />
              <ToolButton icon="scan-outline" label="Repor" onPress={resetTransform} disabled={busy || !ready} />
            </View>
          </View>

          {/* Actions */}
          <View className="flex-row gap-3 px-4 pb-2 pt-2">
            <Pressable
              onPress={onCancel}
              disabled={busy}
              accessibilityRole="button"
              className="flex-1 items-center justify-center rounded-xl border border-white/25 py-3"
            >
              <Text className="text-base font-bold text-white">Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={confirm}
              disabled={busy || !ready}
              accessibilityRole="button"
              style={{ backgroundColor: colors.accent, opacity: busy || !ready ? 0.5 : 1 }}
              className="flex-1 flex-row items-center justify-center gap-2 rounded-xl py-3"
            >
              {busy && <ActivityIndicator color="#fff" size="small" />}
              <Text className="text-base font-bold text-white">Aplicar</Text>
            </Pressable>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

interface ToolButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  /** Mirror the icon horizontally (used for the counter-clockwise rotate). */
  flip?: boolean;
}

function ToolButton({ icon, label, onPress, disabled, flip }: ToolButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ opacity: disabled ? 0.4 : 1 }}
      className="items-center justify-center rounded-lg bg-white/10 px-3 py-2"
    >
      <Ionicons name={icon} size={20} color="#fff" style={flip ? { transform: [{ scaleX: -1 }] } : undefined} />
      <Text className="mt-0.5 text-[10px] font-semibold text-white">{label}</Text>
    </Pressable>
  );
}
