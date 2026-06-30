import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

// Mirrors the web viewer (src/hooks/useImageZoom.ts) so both platforms feel the same.
const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;
const CLOSE_THRESHOLD = 120; // vertical drag (px) needed to dismiss

interface PhotoViewerProps {
  visible: boolean;
  fotos: string[];
  initialIndex?: number;
  onClose: () => void;
}

/**
 * Full-screen image viewer with pinch-to-zoom, double-tap zoom, pan when zoomed,
 * horizontal swipe between photos, and drag-down-to-close — matching the web
 * gallery. Built on react-native-gesture-handler + reanimated.
 */
export function PhotoViewer({ visible, fotos, initialIndex = 0, onClose }: PhotoViewerProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(initialIndex);
  // While an image is zoomed the horizontal pager is disabled so panning works.
  const [zoomed, setZoomed] = useState(false);

  // Keep the pager aligned with the requested photo whenever the viewer opens.
  useEffect(() => {
    if (!visible) return;
    setIndex(initialIndex);
    setZoomed(false);
    // Defer so the ScrollView is laid out before we jump to the offset.
    const id = setTimeout(() => {
      scrollRef.current?.scrollTo({ x: initialIndex * width, animated: false });
    }, 0);
    return () => clearTimeout(id);
  }, [visible, initialIndex, width]);

  const onMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const i = Math.round(e.nativeEvent.contentOffset.x / width);
      setIndex(i);
    },
    [width],
  );

  const goTo = useCallback(
    (i: number) => {
      scrollRef.current?.scrollTo({ x: i * width, animated: true });
      setIndex(i);
    },
    [width],
  );

  if (fotos.length === 0) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* A RN Modal renders in a separate view tree, so gesture-handler needs its
          own root here (the one in _layout.tsx does not cover the modal window). */}
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000' }}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          scrollEnabled={!zoomed}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onMomentumEnd}
        >
          {fotos.map((uri, i) => (
            <ZoomableImage
              key={`${uri}-${i}`}
              uri={uri}
              width={width}
              height={height}
              active={i === index}
              onZoomChange={setZoomed}
              onClose={onClose}
            />
          ))}
        </ScrollView>

        {/* Top bar: counter + close */}
        <View
          className="absolute left-0 right-0 flex-row items-center justify-between px-4"
          style={{ top: insets.top + 4 }}
          pointerEvents="box-none"
        >
          {fotos.length > 1 ? (
            <View className="rounded-full bg-black/55 px-3 py-1">
              <Text className="text-sm font-semibold text-white">
                {index + 1} / {fotos.length}
              </Text>
            </View>
          ) : (
            <View />
          )}
          <Pressable
            onPress={onClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Fechar"
            className="h-10 w-10 items-center justify-center rounded-full bg-black/55"
          >
            <Ionicons name="close" size={24} color="#fff" />
          </Pressable>
        </View>

        {/* Thumbnail strip */}
        {fotos.length > 1 && (
          <View className="absolute left-0 right-0" style={{ bottom: insets.bottom + 12 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-2 px-4"
            >
              {fotos.map((uri, i) => (
                <Pressable
                  key={`thumb-${uri}-${i}`}
                  onPress={() => goTo(i)}
                  accessibilityRole="button"
                  accessibilityLabel={`Ver foto ${i + 1}`}
                  className="overflow-hidden rounded-lg"
                  style={{
                    borderWidth: 2,
                    borderColor: i === index ? colors.accent : 'transparent',
                    opacity: i === index ? 1 : 0.55,
                  }}
                >
                  <Image source={uri} style={{ width: 52, height: 52 }} contentFit="cover" />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </GestureHandlerRootView>
    </Modal>
  );
}

interface ZoomableImageProps {
  uri: string;
  width: number;
  height: number;
  active: boolean;
  onZoomChange: (zoomed: boolean) => void;
  onClose: () => void;
}

function ZoomableImage({ uri, width, height, active, onZoomChange, onClose }: ZoomableImageProps) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);
  const dragY = useSharedValue(0); // drag-to-close offset (only when not zoomed)

  // Local zoom flag mirrors `scale > 1`; drives the parent pager lock and which
  // pan gesture is active.
  const [isZoomed, setIsZoomed] = useState(false);

  const setZoom = useCallback(
    (z: boolean) => {
      setIsZoomed(z);
      onZoomChange(z);
    },
    [onZoomChange],
  );

  const reset = useCallback(() => {
    scale.value = withTiming(1);
    savedScale.value = 1;
    tx.value = withTiming(0);
    ty.value = withTiming(0);
    savedTx.value = 0;
    savedTy.value = 0;
    dragY.value = 0;
    setZoom(false);
  }, [scale, savedScale, tx, ty, savedTx, savedTy, dragY, setZoom]);

  // Reset zoom/pan when this page scrolls off-screen.
  useEffect(() => {
    if (!active) reset();
  }, [active, reset]);

  // Clamp pan so the scaled image stays within the screen bounds.
  const clampPan = (x: number, y: number, s: number) => {
    'worklet';
    const maxX = Math.max(0, (width * s - width) / 2);
    const maxY = Math.max(0, (height * s - height) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    };
  };

  const pinch = useMemo(
    () =>
      Gesture.Pinch()
        .onUpdate((e) => {
          const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, savedScale.value * e.scale));
          // Keep the pinch focal point stationary as the image scales.
          const ratio = next / savedScale.value;
          const focX = e.focalX - width / 2;
          const focY = e.focalY - height / 2;
          tx.value = savedTx.value + (focX - savedTx.value) * (1 - ratio);
          ty.value = savedTy.value + (focY - savedTy.value) * (1 - ratio);
          scale.value = next;
        })
        .onEnd(() => {
          if (scale.value <= MIN_SCALE) {
            scale.value = withTiming(1);
            tx.value = withTiming(0);
            ty.value = withTiming(0);
            savedScale.value = 1;
            savedTx.value = 0;
            savedTy.value = 0;
            runOnJS(setZoom)(false);
            return;
          }
          const c = clampPan(tx.value, ty.value, scale.value);
          tx.value = withTiming(c.x);
          ty.value = withTiming(c.y);
          savedScale.value = scale.value;
          savedTx.value = c.x;
          savedTy.value = c.y;
          runOnJS(setZoom)(true);
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [width, height],
  );

  const doubleTap = useMemo(
    () =>
      Gesture.Tap()
        .numberOfTaps(2)
        .maxDuration(280)
        .onEnd((e) => {
          if (scale.value > MIN_SCALE) {
            scale.value = withTiming(1);
            tx.value = withTiming(0);
            ty.value = withTiming(0);
            savedScale.value = 1;
            savedTx.value = 0;
            savedTy.value = 0;
            runOnJS(setZoom)(false);
          } else {
            const next = DOUBLE_TAP_SCALE;
            const focX = e.x - width / 2;
            const focY = e.y - height / 2;
            const nx = focX * (1 - next);
            const ny = focY * (1 - next);
            const c = clampPan(nx, ny, next);
            scale.value = withTiming(next);
            tx.value = withTiming(c.x);
            ty.value = withTiming(c.y);
            savedScale.value = next;
            savedTx.value = c.x;
            savedTy.value = c.y;
            runOnJS(setZoom)(true);
          }
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [width, height],
  );

  // When zoomed: free pan to move the image (pager is locked).
  // When not zoomed: vertical-only drag to dismiss; horizontal yields to the pager.
  const pan = useMemo(() => {
    const g = Gesture.Pan().maxPointers(1);
    if (isZoomed) {
      return g
        .onUpdate((e) => {
          const c = clampPan(savedTx.value + e.translationX, savedTy.value + e.translationY, scale.value);
          tx.value = c.x;
          ty.value = c.y;
        })
        .onEnd(() => {
          savedTx.value = tx.value;
          savedTy.value = ty.value;
        });
    }
    return g
      .activeOffsetY([-15, 15])
      .failOffsetX([-25, 25])
      .onUpdate((e) => {
        dragY.value = e.translationY;
      })
      .onEnd((e) => {
        if (Math.abs(e.translationY) > CLOSE_THRESHOLD) {
          runOnJS(onClose)();
        } else {
          dragY.value = withSpring(0);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isZoomed, width, height]);

  const composed = Gesture.Race(pan, Gesture.Simultaneous(pinch, doubleTap));

  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value + dragY.value },
      { scale: scale.value },
    ],
  }));

  // Dim/shrink slightly as the user drags down to close.
  const pageStyle = useAnimatedStyle(() => {
    const progress = Math.min(1, Math.abs(dragY.value) / (height * 0.5));
    return { opacity: 1 - progress * 0.6 };
  });

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[{ width, height }, pageStyle]} className="items-center justify-center">
        <Animated.View style={imageStyle}>
          <Image
            source={uri}
            style={{ width, height }}
            contentFit="contain"
            transition={150}
          />
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}
