'use client';

import { X, ArrowsClockwise, CaretDown, CaretLeft, CaretRight, Pause, Play } from '@phosphor-icons/react';
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
/** Auto-play intervals offered by the speed selector (UI copy stays Portuguese). */
const PLAY_SPEEDS_MS = [500, 1000, 2000] as const;
const DEFAULT_SPEED_MS = 1000;

/** "0,5s" / "1s" / "2s" — decimal comma, per the Portuguese UI copy. */
const speedLabel = (ms: number) => `${(ms / 1000).toString().replace('.', ',')}s`;

export default function Spin360Viewer({ show, onClose, frames, angles }: Spin360ViewerProps) {
  const [frame, setFrame] = useState(0);
  const [interacted, setInteracted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState<number>(DEFAULT_SPEED_MS);
  // Drag session: frame when the drag started + pointer origin.
  const dragRef = useRef<{ startX: number; startFrame: number } | null>(null);

  const stepFrame = useCallback(
    (delta: number) => {
      setInteracted(true);
      // Taking over manually pauses the auto-rotation.
      setPlaying(false);
      // One step = one frame of drag, sharing the tested wrap-around math.
      setFrame((f) => spinFrameFromDrag(f, -delta * SPIN_PX_PER_FRAME, frames.length));
    },
    [frames.length],
  );

  useEffect(() => {
    if (!show || !playing) return;
    const id = setInterval(
      () => setFrame((f) => spinFrameFromDrag(f, -SPIN_PX_PER_FRAME, frames.length)),
      speedMs,
    );
    return () => clearInterval(id);
  }, [show, playing, speedMs, frames.length]);

  useEffect(() => {
    if (!show) return;
    setFrame(0);
    setInteracted(false);
    setPlaying(false);
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
    setPlaying(false);
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

      {/* Stage: a compact centered column — the photo box with its controls
          right below it, not pinned to the viewport edges. */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-3 px-4 pb-4">
        <div
          className="relative w-full max-w-2xl max-h-[70vh] touch-none cursor-grab active:cursor-grabbing"
          style={{ aspectRatio: '4 / 3' }}
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
              className={`absolute inset-0 w-full h-full object-contain pointer-events-none ${
                i === frame ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}

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
            <p className="absolute bottom-3 left-1/2 -translate-x-1/2 w-max text-[11px] text-fg-inverse/70 flex items-center gap-1 pointer-events-none">
              <ArrowsClockwise className="text-sm" />
              Arraste para os lados para rodar o veículo
            </p>
          )}
        </div>

        {/* Auto-rotation controls, right below the photo */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setInteracted(true);
              setPlaying((p) => !p);
            }}
            aria-label={playing ? 'Pausar rotação automática' : 'Reproduzir rotação automática'}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-fg-inverse transition"
          >
            {playing ? <Pause className="text-xl" weight="fill" /> : <Play className="text-xl" weight="fill" />}
          </button>
          <div className="relative">
            <select
              value={speedMs}
              onChange={(e) => setSpeedMs(Number(e.target.value))}
              aria-label="Velocidade da rotação automática"
              // color-scheme keeps the native option popup dark, matching the viewer.
              style={{ colorScheme: 'dark' }}
              className="h-9 rounded-full bg-white/10 hover:bg-white/20 text-fg-inverse text-xs font-semibold pl-3 pr-8 appearance-none transition cursor-pointer"
            >
              {PLAY_SPEEDS_MS.map((ms) => (
                <option key={ms} value={ms} className="bg-neutral-900 text-white">
                  {speedLabel(ms)}
                </option>
              ))}
            </select>
            <CaretDown
              size={12}
              weight="bold"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-inverse pointer-events-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
