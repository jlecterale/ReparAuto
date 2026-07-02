'use client';

import { X, ArrowsClockwise, CaretLeft, CaretRight } from '@phosphor-icons/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SPIN_ANGLE_LABELS, SPIN_PX_PER_FRAME, spinFrameFromDrag, type SpinAngle } from '@/lib/spin360';

interface Spin360ViewerProps {
  show: boolean;
  onClose: () => void;
  /** Ordered rotation frames (from getSpinFrames). */
  frames: string[];
  /** Angle of each frame (from getSpinAngles), used for the on-screen label. */
  angles: SpinAngle[];
}

/**
 * Fullscreen drag-to-rotate viewer: horizontal drag (pointer or touch)
 * scrubs through the tagged angle photos in circular order.
 */
export default function Spin360Viewer({ show, onClose, frames, angles }: Spin360ViewerProps) {
  const [frame, setFrame] = useState(0);
  const [interacted, setInteracted] = useState(false);
  // Drag session: frame when the drag started + pointer origin.
  const dragRef = useRef<{ startX: number; startFrame: number } | null>(null);

  const stepFrame = useCallback(
    (delta: number) => {
      setInteracted(true);
      // One step = one frame of drag, sharing the tested wrap-around math.
      setFrame((f) => spinFrameFromDrag(f, -delta * SPIN_PX_PER_FRAME, frames.length));
    },
    [frames.length],
  );

  useEffect(() => {
    if (!show) return;
    setFrame(0);
    setInteracted(false);
    document.body.style.overflow = 'hidden';
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') stepFrame(-1);
      else if (e.key === 'ArrowRight') stepFrame(1);
    }
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKey);
    };
  }, [show, onClose, stepFrame]);

  if (!show || frames.length === 0) return null;

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startFrame: frame };
    setInteracted(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    setFrame(spinFrameFromDrag(dragRef.current.startFrame, e.clientX - dragRef.current.startX, frames.length));
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex flex-col select-none page-enter"
      role="dialog"
      aria-modal="true"
      aria-label="Vista 360 graus do veículo"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 text-fg-inverse shrink-0">
        <span className="text-sm font-semibold flex items-center gap-2">
          <ArrowsClockwise className="text-lg" />
          Vista 360°
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar vista 360"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"
        >
          <X className="text-xl" />
        </button>
      </div>

      {/* Stage */}
      <div className="relative flex-1 min-h-0 overflow-hidden">
        <div
          className="absolute inset-0 flex items-center justify-center touch-none cursor-grab active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {/* All frames stay mounted (pre-decoded) so scrubbing never flickers. */}
          {frames.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`Veículo — ${SPIN_ANGLE_LABELS[angles[i]] ?? `ângulo ${i + 1}`}`}
              draggable={false}
              className={`absolute max-w-full max-h-full object-contain pointer-events-none ${
                i === frame ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}
        </div>

        {/* Manual stepping for pointer devices / accessibility */}
        <button
          type="button"
          onClick={() => stepFrame(-1)}
          aria-label="Rodar para a esquerda"
          className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-fg-inverse transition"
        >
          <CaretLeft className="text-2xl" />
        </button>
        <button
          type="button"
          onClick={() => stepFrame(1)}
          aria-label="Rodar para a direita"
          className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-fg-inverse transition"
        >
          <CaretRight className="text-2xl" />
        </button>

        {/* Current angle */}
        <span
          aria-live="polite"
          className="absolute top-3 left-1/2 -translate-x-1/2 bg-white/10 text-fg-inverse text-xs font-semibold px-3 py-1 rounded-full pointer-events-none"
        >
          {SPIN_ANGLE_LABELS[angles[frame]] ?? ''}
        </span>

        {/* Drag hint (until first interaction) */}
        {!interacted && (
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[11px] text-fg-inverse/70 flex items-center gap-1 pointer-events-none">
            <ArrowsClockwise className="text-sm" />
            Arraste para os lados para rodar o veículo
          </p>
        )}
      </div>
    </div>
  );
}
