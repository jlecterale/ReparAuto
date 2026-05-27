import { useRef, useCallback } from 'react';

interface SwipeHandlers {
  onLeft?: () => void;
  onRight?: () => void;
}

interface SwipeBindings {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

const THRESHOLD = 50;

export default function useSwipe(handlers: SwipeHandlers): SwipeBindings {
  const startX = useRef(0);
  const startY = useRef(0);
  const swiping = useRef(false);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    swiping.current = false;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (swiping.current) return;
    const dx = Math.abs(e.touches[0].clientX - startX.current);
    const dy = Math.abs(e.touches[0].clientY - startY.current);
    if (dx > 10 && dx > dy) {
      swiping.current = true;
    }
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!swiping.current) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(dx) < THRESHOLD) return;
    if (dx > 0) handlersRef.current.onRight?.();
    else handlersRef.current.onLeft?.();
  }, []);

  return { onTouchStart, onTouchMove, onTouchEnd };
}
