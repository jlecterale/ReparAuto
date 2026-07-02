import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { SPIN_ANGLE_LABELS, SPIN_PX_PER_FRAME, spinFrameFromDrag, type SpinAngle } from '@/lib/spin360';

interface Spin360ViewerProps {
  visible: boolean;
  onClose: () => void;
  /** Ordered rotation frames (from getSpinFrames). */
  frames: string[];
  /** Angle of each frame (from getSpinAngles), used for the on-screen label. */
  angles: SpinAngle[];
}

/**
 * Fullscreen drag-to-rotate viewer: a horizontal pan scrubs through the
 * tagged angle photos in circular order (mirror of the web Spin360Viewer).
 */
/** Auto-play intervals offered by the speed selector (UI copy stays Portuguese). */
const PLAY_SPEEDS_MS = [500, 1000, 2000] as const;
const DEFAULT_SPEED_MS = 1000;

/** "0,5s" / "1s" / "2s" — decimal comma, per the Portuguese UI copy. */
const speedLabel = (ms: number) => `${(ms / 1000).toString().replace('.', ',')}s`;

export function Spin360Viewer({ visible, onClose, frames, angles }: Spin360ViewerProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [frame, setFrame] = useState(0);
  const [interacted, setInteracted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState<number>(DEFAULT_SPEED_MS);
  // Refs so the gesture callbacks never read a stale frame mid-drag.
  const frameRef = useRef(0);
  const startFrameRef = useRef(0);

  useEffect(() => {
    if (visible) {
      frameRef.current = 0;
      setFrame(0);
      setInteracted(false);
      setPlaying(false);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible || !playing) return;
    const id = setInterval(() => {
      // Advance through frameRef (not setState alone) so a drag right after
      // auto-play always starts from the frame on screen.
      const next = spinFrameFromDrag(frameRef.current, -SPIN_PX_PER_FRAME, frames.length);
      frameRef.current = next;
      setFrame(next);
    }, speedMs);
    return () => clearInterval(id);
  }, [visible, playing, speedMs, frames.length]);

  if (!visible || frames.length === 0) return null;

  const showFrame = (f: number) => {
    frameRef.current = f;
    setFrame(f);
  };

  const pan = Gesture.Pan()
    .runOnJS(true)
    .onStart(() => {
      startFrameRef.current = frameRef.current;
      setInteracted(true);
      // Taking over manually pauses the auto-rotation.
      setPlaying(false);
    })
    .onUpdate((e) => {
      showFrame(spinFrameFromDrag(startFrameRef.current, e.translationX, frames.length));
    });

  return (
    <Modal visible animationType="fade" onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View className="flex-1 bg-black">
          {/* Top bar */}
          <View style={{ marginTop: insets.top + 8 }} className="flex-row items-center justify-between px-4">
            <View className="flex-row items-center gap-2">
              <Ionicons name="sync-outline" size={18} color="#fff" />
              <Text className="text-sm font-bold text-white">Vista 360°</Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Fechar vista 360"
              className="h-10 w-10 items-center justify-center rounded-full bg-white/10"
            >
              <Ionicons name="close" size={22} color="#fff" />
            </Pressable>
          </View>

          {/* Stage: a compact centered column — the photo box with its
              controls right below it, not pinned to the screen edges. */}
          <GestureDetector gesture={pan}>
            <View className="flex-1 items-center justify-center gap-3">
              <View style={{ width, height: width * 0.75 }}>
                {/* All frames stay mounted (pre-decoded) so scrubbing never flickers. */}
                {frames.map((src, i) => (
                  <Image
                    key={src}
                    source={src}
                    style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      opacity: i === frame ? 1 : 0,
                    }}
                    contentFit="contain"
                    accessibilityLabel={`Veículo — ${SPIN_ANGLE_LABELS[angles[i]] ?? `ângulo ${i + 1}`}`}
                  />
                ))}

                {/* Current angle */}
                <View className="absolute top-3 w-full items-center">
                  <View className="rounded-full bg-white/10 px-3 py-1">
                    <Text accessibilityLiveRegion="polite" className="text-xs font-bold text-white">
                      {SPIN_ANGLE_LABELS[angles[frame]] ?? ''}
                    </Text>
                  </View>
                </View>

                {/* Drag hint (until first interaction) */}
                {!interacted && (
                  <View className="absolute bottom-3 w-full flex-row items-center justify-center gap-1.5">
                    <Ionicons name="sync-outline" size={14} color="rgba(255,255,255,0.7)" />
                    <Text className="text-[11px] text-white/70">
                      Arraste para os lados para rodar o veículo
                    </Text>
                  </View>
                )}
              </View>

              {/* Auto-rotation controls, right below the photo */}
              <View className="flex-row items-center gap-2">
                <Pressable
                  onPress={() => {
                    setInteracted(true);
                    setPlaying((p) => !p);
                  }}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={playing ? 'Pausar rotação automática' : 'Reproduzir rotação automática'}
                  className="h-11 w-11 items-center justify-center rounded-full bg-white/10 active:bg-white/25"
                >
                  <Ionicons name={playing ? 'pause' : 'play'} size={20} color="#fff" />
                </Pressable>
                <View className="flex-row overflow-hidden rounded-full bg-white/10">
                  {PLAY_SPEEDS_MS.map((ms) => (
                    <Pressable
                      key={ms}
                      onPress={() => setSpeedMs(ms)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: speedMs === ms }}
                      accessibilityLabel={`Velocidade: ${speedLabel(ms)}`}
                      className={`px-3 py-2 active:bg-white/25 ${speedMs === ms ? 'bg-white/30' : ''}`}
                    >
                      <Text className={`text-xs font-bold ${speedMs === ms ? 'text-white' : 'text-white/60'}`}>
                        {speedLabel(ms)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          </GestureDetector>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
