'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ArrowCounterClockwise,
  ArrowClockwise,
  ArrowsOut,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  Spinner,
  X,
} from '@phosphor-icons/react';
import Button from '@/components/ui/Button';
import { LISTING_PHOTO_ASPECT } from '@/lib/constants';
import {
  clampOffset,
  coverScale,
  cropImageToBlob,
  type CropTransform,
} from '@/lib/cropImage';

interface ImageCropperProps {
  /** Source image (blob:, data: or http(s) URL). */
  src: string;
  /** Target aspect ratio (width / height). Defaults to the listing standard 4:3. */
  aspect?: number;
  /** Optional heading, e.g. "Foto 2 de 6". */
  titulo?: string;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void | Promise<void>;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;

export default function ImageCropper({
  src,
  aspect = LISTING_PHOTO_ASPECT,
  titulo,
  onCancel,
  onConfirm,
}: ImageCropperProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStart = useRef<{ dist: number; zoom: number } | null>(null);

  const [frame, setFrame] = useState({ w: 0, h: 0 });
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [ready, setReady] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const isRemote = !src.startsWith('blob:') && !src.startsWith('data:');

  // Keep the crop frame matched to the rendered width at the target aspect ratio.
  useLayoutEffect(() => {
    const el = frameRef.current?.parentElement;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      setFrame({ w, h: Math.round(w / aspect) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [aspect]);

  // Lock background scroll + close on Escape, mirroring <Modal>.
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onCancel]);

  const clamp = useCallback(
    (next: { x: number; y: number }, z: number, rot: number) => {
      if (!natural.w || !frame.w) return next;
      const scale = coverScale(natural.w, natural.h, frame.w, frame.h, rot) * z;
      return {
        x: clampOffset(next.x, 'x', natural.w, natural.h, frame.w, frame.h, scale, rot),
        y: clampOffset(next.y, 'y', natural.w, natural.h, frame.w, frame.h, scale, rot),
      };
    },
    [natural, frame],
  );

  const applyZoom = useCallback(
    (next: number) => {
      const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next));
      setZoom(z);
      setOffset((o) => clamp(o, z, rotation));
    },
    [clamp, rotation],
  );

  const rotate = useCallback(
    (dir: 1 | -1) => {
      const rot = (((rotation + dir * 90) % 360) + 360) % 360;
      setRotation(rot);
      setOffset((o) => clamp(o, zoom, rot));
    },
    [clamp, rotation, zoom],
  );

  const reset = useCallback(() => {
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  }, []);

  const onImgLoad = () => {
    const el = imgRef.current;
    if (!el) return;
    setNatural({ w: el.naturalWidth, h: el.naturalHeight });
    setReady(true);
    setErro(null);
  };

  // --- Pointer (drag + pinch) ---
  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinchStart.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinchStart.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      applyZoom((pinchStart.current.zoom * dist) / pinchStart.current.dist);
      return;
    }
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    setOffset((o) => clamp({ x: o.x + dx, y: o.y + dy }, zoom, rotation));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
  };

  const onWheel = (e: React.WheelEvent) => {
    applyZoom(zoom * (e.deltaY < 0 ? 1.08 : 0.92));
  };

  const handleConfirm = async () => {
    if (!imgRef.current || !ready || !frame.w) return;
    setProcessing(true);
    try {
      const transform: CropTransform = { zoom, rotation, offsetX: offset.x, offsetY: offset.y };
      const blob = await cropImageToBlob(imgRef.current, frame.w, frame.h, transform, aspect);
      await onConfirm(blob);
    } catch {
      setErro('Não foi possível recortar esta imagem. Remova-a e adicione novamente.');
    } finally {
      setProcessing(false);
    }
  };

  const scale = natural.w && frame.w ? coverScale(natural.w, natural.h, frame.w, frame.h, rotation) * zoom : 1;

  return (
    <div className="fixed inset-0 bg-black/90 z-[110] flex flex-col" role="dialog" aria-modal="true" aria-label="Editar imagem">
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <h3 className="text-sm font-bold">{titulo || 'Ajustar foto'}</h3>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Fechar editor"
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/15 transition"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 min-h-0">
        <div className="w-full max-w-lg">
          <div
            ref={frameRef}
            className="relative mx-auto flex items-center justify-center overflow-hidden rounded-lg bg-neutral-900 touch-none select-none cursor-grab active:cursor-grabbing"
            style={{ width: frame.w || '100%', height: frame.h || undefined, aspectRatio: frame.h ? undefined : String(aspect) }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onWheel={onWheel}
          >
            {/* Centred by the flex parent, then transformed about its own centre so the
                preview matches cropImageToBlob exactly. */}
            <img
              ref={imgRef}
              src={src}
              alt="Pré-visualização do recorte"
              draggable={false}
              crossOrigin={isRemote ? 'anonymous' : undefined}
              onLoad={onImgLoad}
              onError={() => setErro('Não foi possível carregar a imagem para edição.')}
              className="max-w-none shrink-0 pointer-events-none"
              style={{
                width: natural.w || undefined,
                height: natural.h || undefined,
                transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(${scale})`,
                transformOrigin: 'center',
                opacity: ready ? 1 : 0,
              }}
            />
            {!ready && !erro && (
              <div className="absolute inset-0 flex items-center justify-center text-white/70">
                <Spinner size={28} className="animate-spin" />
              </div>
            )}
            {/* Rule-of-thirds grid for alignment */}
            {ready && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-y-0 left-1/3 w-px bg-white/25" />
                <div className="absolute inset-y-0 left-2/3 w-px bg-white/25" />
                <div className="absolute inset-x-0 top-1/3 h-px bg-white/25" />
                <div className="absolute inset-x-0 top-2/3 h-px bg-white/25" />
              </div>
            )}
          </div>

          {erro && (
            <p className="text-xs text-danger-300 mt-3 text-center" role="alert">
              {erro}
            </p>
          )}

          {/* Zoom slider */}
          <div className="flex items-center gap-3 mt-4 text-white/80">
            <MagnifyingGlassMinus size={18} className="shrink-0" />
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.01}
              value={zoom}
              onChange={(e) => applyZoom(Number(e.target.value))}
              aria-label="Zoom"
              className="flex-1 accent-accent cursor-pointer"
            />
            <MagnifyingGlassPlus size={18} className="shrink-0" />
          </div>

          {/* Tool buttons */}
          <div className="flex items-center justify-center gap-2 mt-3">
            <button
              type="button"
              onClick={() => rotate(-1)}
              aria-label="Rodar para a esquerda"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition"
            >
              <ArrowCounterClockwise size={16} /> Rodar
            </button>
            <button
              type="button"
              onClick={() => rotate(1)}
              aria-label="Rodar para a direita"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition"
            >
              <ArrowClockwise size={16} /> Rodar
            </button>
            <button
              type="button"
              onClick={reset}
              aria-label="Repor"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition"
            >
              <ArrowsOut size={16} /> Repor
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-3 px-4 py-4 max-w-lg mx-auto w-full">
        <Button tipo="ghost" tamanho="lg" onClick={onCancel} className="flex-1" disabled={processing}>
          Cancelar
        </Button>
        <Button
          tipo="primario"
          tamanho="lg"
          onClick={handleConfirm}
          className="flex-1"
          disabled={!ready || processing || !!erro}
          carregando={processing}
        >
          Aplicar
        </Button>
      </div>
    </div>
  );
}
