import { useRef, useCallback } from 'react';

interface PinchZoomBindings {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onTouchCancel: (e: React.TouchEvent) => void;
  reset: () => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;

function getDistance(t1: React.Touch, t2: React.Touch): number {
  return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
}

export default function usePinchZoom(): PinchZoomBindings {
  const initialDistance = useRef(0);
  const currentScale = useRef(1);
  const baseScale = useRef(1);
  const targetRef = useRef<HTMLElement | null>(null);
  const isPinching = useRef(false);
  const originX = useRef(0);
  const originY = useRef(0);

  const reset = useCallback(() => {
    currentScale.current = 1;
    baseScale.current = 1;
    isPinching.current = false;
    const target = targetRef.current;
    if (target) {
      const img = target.querySelector('img');
      if (img) {
        img.style.transition = 'transform 0.2s ease';
        img.style.transform = '';
        img.style.transformOrigin = '';
        setTimeout(() => { if (img) img.style.transition = ''; }, 200);
      }
    }
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = getDistance(e.touches[0], e.touches[1]);
      if (dist === 0) return;
      isPinching.current = true;
      initialDistance.current = dist;
      baseScale.current = currentScale.current;
      targetRef.current = e.currentTarget as HTMLElement;
      const rect = targetRef.current.getBoundingClientRect();
      originX.current = ((e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left) / rect.width * 100;
      originY.current = ((e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top) / rect.height * 100;
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPinching.current || e.touches.length < 2 || !targetRef.current) return;
    if (initialDistance.current === 0) return;
    const dist = getDistance(e.touches[0], e.touches[1]);
    const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, baseScale.current * (dist / initialDistance.current)));
    currentScale.current = scale;
    const img = targetRef.current.querySelector('img');
    if (img) {
      img.style.transform = `scale(${scale})`;
      img.style.transformOrigin = `${originX.current}% ${originY.current}%`;
    }
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isPinching.current) return;
    if (e.touches.length < 2) {
      isPinching.current = false;
      if (currentScale.current <= 1.05) {
        reset();
      }
    }
  }, [reset]);

  const onTouchCancel = useCallback(() => {
    if (isPinching.current) {
      reset();
    }
  }, [reset]);

  return { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel, reset };
}
