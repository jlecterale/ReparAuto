import { useRef, useCallback } from 'react';

interface SwipeHandlers {
  onLeft?: () => void;
  onRight?: () => void;
}

interface SwipeBindings {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onTouchCancel: (e: React.TouchEvent) => void;
}

const THRESHOLD = 50;
const MAX_DRAG = 120;

export default function useSwipe(handlers: SwipeHandlers): SwipeBindings {
  const startX = useRef(0);
  const startY = useRef(0);
  const swiping = useRef(false);
  const targetRef = useRef<HTMLElement | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const resetTarget = useCallback(() => {
    const el = targetRef.current;
    if (el) {
      el.classList.add('gallery-slide');
      el.style.transform = '';
      el.style.opacity = '';
    }
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    swiping.current = false;
    targetRef.current = e.currentTarget as HTMLElement;
    targetRef.current.classList.remove('gallery-slide');
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - startX.current;
    const dy = Math.abs(e.touches[0].clientY - startY.current);
    const absDx = Math.abs(dx);

    if (!swiping.current) {
      if (absDx > 10 && absDx > dy) {
        swiping.current = true;
      } else {
        return;
      }
    }

    if (targetRef.current) {
      const clamped = Math.max(-MAX_DRAG, Math.min(MAX_DRAG, dx));
      targetRef.current.style.transform = `translateX(${clamped}px)`;
      targetRef.current.style.opacity = String(1 - Math.abs(clamped) / (MAX_DRAG * 3));
    }
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    resetTarget();
    if (!swiping.current) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    swiping.current = false;
    if (Math.abs(dx) < THRESHOLD) return;
    if (dx > 0) handlersRef.current.onRight?.();
    else handlersRef.current.onLeft?.();
  }, [resetTarget]);

  const onTouchCancel = useCallback(() => {
    resetTarget();
    swiping.current = false;
  }, [resetTarget]);

  return { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel };
}
