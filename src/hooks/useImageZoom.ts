'use client';

import { useCallback, useRef, useState } from 'react';

interface UseImageZoomOptions {
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

interface ImageZoomBindings {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onWheel: (e: React.WheelEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onDoubleClick: (e: React.MouseEvent) => void;
}

interface UseImageZoomResult {
  bindings: ImageZoomBindings;
  imgRef: (el: HTMLImageElement | null) => void;
  zoomed: boolean;
  resetZoom: () => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;
const SWIPE_THRESHOLD = 60;
const CLOSE_THRESHOLD = 110;
const DOUBLE_TAP_MS = 280;

type Mode = 'none' | 'pinch' | 'pan' | 'drag';

function distance(t1: React.Touch, t2: React.Touch): number {
  return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/**
 * Self-contained zoom/pan/swipe controller for a fullscreen image viewer.
 * Writes transforms directly to the image element (no re-render per frame).
 * One finger pans when zoomed, otherwise swipes to navigate or drag-down to
 * close; two fingers pinch-zoom toward the gesture focal point. Mouse wheel
 * and double-click/tap zoom on desktop.
 */
export default function useImageZoom({ onNext, onPrev, onClose }: UseImageZoomOptions): UseImageZoomResult {
  const img = useRef<HTMLImageElement | null>(null);
  const [zoomed, setZoomed] = useState(false);

  const scale = useRef(1);
  const tx = useRef(0);
  const ty = useRef(0);

  const mode = useRef<Mode>('none');
  const startScale = useRef(1);
  const startDist = useRef(0);
  const startTx = useRef(0);
  const startTy = useRef(0);
  const startX = useRef(0);
  const startY = useRef(0);
  const prevMidX = useRef(0);
  const prevMidY = useRef(0);
  const axisLock = useRef<'x' | 'y' | null>(null);
  const lastTap = useRef(0);

  const apply = useCallback((animate = false) => {
    const el = img.current;
    if (!el) return;
    el.style.transition = animate ? 'transform 0.22s ease' : 'none';
    el.style.transform = `translate3d(${tx.current}px, ${ty.current}px, 0) scale(${scale.current})`;
    el.style.opacity = '1';
    const isZoomed = scale.current > 1.02;
    setZoomed((z) => (z === isZoomed ? z : isZoomed));
  }, []);

  const setScale = useCallback((next: number) => {
    const wasZoomed = scale.current > 1.02;
    scale.current = next;
    if (next <= 1.02 && wasZoomed) {
      tx.current = 0;
      ty.current = 0;
    }
  }, []);

  const clampPan = useCallback(() => {
    const el = img.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // rect already includes the active scale; recover the un-scaled box.
    const baseW = rect.width / scale.current;
    const baseH = rect.height / scale.current;
    const maxX = (baseW * (scale.current - 1)) / 2;
    const maxY = (baseH * (scale.current - 1)) / 2;
    tx.current = clamp(tx.current, -maxX, maxX);
    ty.current = clamp(ty.current, -maxY, maxY);
  }, []);

  const resetZoom = useCallback(() => {
    scale.current = 1;
    tx.current = 0;
    ty.current = 0;
    mode.current = 'none';
    apply(false);
  }, [apply]);

  const center = useCallback(() => {
    const el = img.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    // The bounding box already includes the current translate (scaling about
    // the center doesn't move it), so subtract it to recover the fixed layout
    // center that the focal-zoom math is expressed against.
    return {
      x: rect.left + rect.width / 2 - tx.current,
      y: rect.top + rect.height / 2 - ty.current,
    };
  }, []);

  // Zoom toward a focal point (screen coords), keeping that point stationary.
  const zoomToward = useCallback((focalX: number, focalY: number, nextScale: number) => {
    const c = center();
    const fx = focalX - c.x;
    const fy = focalY - c.y;
    const factor = nextScale / scale.current;
    tx.current = fx - factor * (fx - tx.current);
    ty.current = fy - factor * (fy - ty.current);
    setScale(nextScale);
    clampPan();
  }, [center, setScale, clampPan]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      mode.current = 'pinch';
      axisLock.current = null;
      startDist.current = distance(e.touches[0], e.touches[1]);
      startScale.current = scale.current;
      prevMidX.current = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      prevMidY.current = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      return;
    }
    if (e.touches.length === 1) {
      const t = e.touches[0];
      startX.current = t.clientX;
      startY.current = t.clientY;
      startTx.current = tx.current;
      startTy.current = ty.current;
      axisLock.current = null;
      mode.current = scale.current > 1.02 ? 'pan' : 'drag';

      // Double-tap to toggle zoom.
      const now = e.timeStamp;
      if (now - lastTap.current < DOUBLE_TAP_MS) {
        lastTap.current = 0;
        if (scale.current > 1.02) {
          resetZoom();
        } else {
          zoomToward(t.clientX, t.clientY, DOUBLE_TAP_SCALE);
          apply(true);
        }
        mode.current = 'none';
        return;
      }
      lastTap.current = now;
    }
  }, [resetZoom, zoomToward, apply]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (mode.current === 'pinch' && e.touches.length === 2) {
      e.preventDefault();
      const dist = distance(e.touches[0], e.touches[1]);
      if (startDist.current === 0) return;
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const next = clamp(startScale.current * (dist / startDist.current), MIN_SCALE, MAX_SCALE);
      zoomToward(midX, midY, next);
      // Pan with the two-finger movement too.
      tx.current += midX - prevMidX.current;
      ty.current += midY - prevMidY.current;
      prevMidX.current = midX;
      prevMidY.current = midY;
      clampPan();
      apply(false);
      return;
    }

    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    const dx = t.clientX - startX.current;
    const dy = t.clientY - startY.current;

    if (mode.current === 'pan') {
      e.preventDefault();
      tx.current = startTx.current + dx;
      ty.current = startTy.current + dy;
      clampPan();
      apply(false);
      return;
    }

    if (mode.current === 'drag') {
      if (!axisLock.current) {
        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
          axisLock.current = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        } else {
          return;
        }
      }
      e.preventDefault();
      const el = img.current;
      if (!el) return;
      if (axisLock.current === 'x') {
        el.style.transition = 'none';
        el.style.transform = `translate3d(${dx}px, 0, 0)`;
        el.style.opacity = String(1 - Math.min(Math.abs(dx) / 600, 0.4));
      } else if (dy > 0) {
        el.style.transition = 'none';
        el.style.transform = `translate3d(0, ${dy}px, 0) scale(${1 - Math.min(dy / 1200, 0.15)})`;
        el.style.opacity = String(1 - Math.min(dy / 400, 0.6));
      }
    }
  }, [zoomToward, clampPan, apply]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (mode.current === 'pinch') {
      if (e.touches.length === 0) {
        if (scale.current <= 1.02) resetZoom();
        else apply(false);
        mode.current = 'none';
      }
      return;
    }

    if (mode.current === 'pan') {
      mode.current = 'none';
      clampPan();
      apply(true);
      return;
    }

    if (mode.current === 'drag') {
      const dx = e.changedTouches[0].clientX - startX.current;
      const dy = e.changedTouches[0].clientY - startY.current;
      mode.current = 'none';
      if (axisLock.current === 'x' && Math.abs(dx) > SWIPE_THRESHOLD) {
        if (dx < 0) onNext();
        else onPrev();
        resetZoom();
      } else if (axisLock.current === 'y' && dy > CLOSE_THRESHOLD) {
        onClose();
      } else {
        resetZoom();
      }
      axisLock.current = null;
    }
  }, [resetZoom, clampPan, apply, onNext, onPrev, onClose]);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const next = clamp(scale.current * (1 - e.deltaY * 0.0016), MIN_SCALE, MAX_SCALE);
    if (next === scale.current) return;
    zoomToward(e.clientX, e.clientY, next);
    apply(false);
  }, [zoomToward, apply]);

  const onDoubleClick = useCallback((e: React.MouseEvent) => {
    if (scale.current > 1.02) {
      resetZoom();
    } else {
      zoomToward(e.clientX, e.clientY, DOUBLE_TAP_SCALE);
      apply(true);
    }
  }, [resetZoom, zoomToward, apply]);

  // Mouse drag to pan when zoomed (desktop).
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale.current <= 1.02) return;
    e.preventDefault();
    const originTx = tx.current;
    const originTy = ty.current;
    const ox = e.clientX;
    const oy = e.clientY;
    const move = (ev: MouseEvent) => {
      tx.current = originTx + (ev.clientX - ox);
      ty.current = originTy + (ev.clientY - oy);
      clampPan();
      apply(false);
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  }, [clampPan, apply]);

  const setImgRef = useCallback((el: HTMLImageElement | null) => {
    img.current = el;
    if (el) {
      scale.current = 1;
      tx.current = 0;
      ty.current = 0;
      mode.current = 'none';
      el.style.transform = '';
      el.style.opacity = '1';
    }
  }, []);

  return {
    bindings: { onTouchStart, onTouchMove, onTouchEnd, onWheel, onMouseDown, onDoubleClick },
    imgRef: setImgRef,
    zoomed,
    resetZoom,
  };
}
