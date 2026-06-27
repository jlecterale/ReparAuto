'use client';

import { CaretLeft, CaretRight, X, MagnifyingGlassPlus } from '@phosphor-icons/react';
import { useCallback, useEffect, useState } from 'react';
import { renderFoto } from '@/lib/utils';
import FotoRender from '@/components/ui/FotoRender';
import useImageZoom from '@/hooks/useImageZoom';

interface GalleryModalProps {
  show: boolean;
  onClose: () => void;
  fotos?: string[];
  indiceInicial?: number;
}

export default function GalleryModal({ show, onClose, fotos = [], indiceInicial = 0 }: GalleryModalProps) {
  const [indice, setIndice] = useState(indiceInicial);

  useEffect(() => {
    if (show) setIndice(indiceInicial);
  }, [show, indiceInicial]);

  const goNext = useCallback(
    () => setIndice((i) => (i < fotos.length - 1 ? i + 1 : 0)),
    [fotos.length],
  );
  const goPrev = useCallback(
    () => setIndice((i) => (i > 0 ? i - 1 : fotos.length - 1)),
    [fotos.length],
  );

  const { bindings, imgRef, zoomed, resetZoom } = useImageZoom({
    onNext: goNext,
    onPrev: goPrev,
    onClose,
  });

  // Reset zoom whenever the visible photo changes (buttons, keys, thumbnails).
  useEffect(() => {
    resetZoom();
  }, [indice, resetZoom]);

  useEffect(() => {
    if (!show) return;
    document.body.style.overflow = 'hidden';
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
    }
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKey);
    };
  }, [show, goNext, goPrev, onClose]);

  if (!show || fotos.length === 0) return null;

  const atual = renderFoto(fotos[indice]);
  const temVarias = fotos.length > 1;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex flex-col select-none page-enter"
      role="dialog"
      aria-modal="true"
      aria-label="Galeria de fotos"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 text-fg-inverse shrink-0">
        <span className="text-sm font-semibold tabular-nums">
          {indice + 1} / {fotos.length}
        </span>
        <button
          onClick={onClose}
          aria-label="Fechar galeria"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"
        >
          <X className="text-xl" />
        </button>
      </div>

      {/* Stage */}
      <div className="relative flex-1 min-h-0 overflow-hidden">
        <div
          className="absolute inset-0 flex items-center justify-center touch-none"
          onTouchStart={bindings.onTouchStart}
          onTouchMove={bindings.onTouchMove}
          onTouchEnd={bindings.onTouchEnd}
          onWheel={bindings.onWheel}
          onMouseDown={bindings.onMouseDown}
          onDoubleClick={bindings.onDoubleClick}
          onClick={(e) => { if (e.target === e.currentTarget && !zoomed) onClose(); }}
        >
          {atual.type === 'img' ? (
            <img
              key={indice}
              ref={imgRef}
              src={atual.src}
              alt={`Foto ${indice + 1} de ${fotos.length}`}
              draggable={false}
              className={`max-w-full max-h-full object-contain will-change-transform ${zoomed ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'}`}
            />
          ) : (
            <div className="text-[20vh] leading-none">{atual.emoji}</div>
          )}
        </div>

        {/* Prev / Next (pointer devices) */}
        {temVarias && (
          <>
            <button
              onClick={goPrev}
              aria-label="Foto anterior"
              className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-fg-inverse transition"
            >
              <CaretLeft className="text-2xl" />
            </button>
            <button
              onClick={goNext}
              aria-label="Próxima foto"
              className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-fg-inverse transition"
            >
              <CaretRight className="text-2xl" />
            </button>
          </>
        )}

        {/* Zoom hint */}
        {!zoomed && (
          <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[11px] text-fg-inverse/70 flex items-center gap-1 pointer-events-none">
            <MagnifyingGlassPlus className="text-sm" />
            <span className="hidden sm:inline">Duplo clique ou roda do rato para ampliar</span>
            <span className="sm:hidden">Toque duplo ou belisque para ampliar</span>
          </p>
        )}
      </div>

      {/* Thumbnails */}
      {temVarias && (
        <div className="shrink-0 px-3 py-3 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 justify-center min-w-min mx-auto w-max">
            {fotos.map((foto, i) => (
              <button
                key={i}
                onClick={() => setIndice(i)}
                aria-label={`Foto ${i + 1}`}
                aria-current={i === indice ? 'true' : undefined}
                className={`w-14 h-14 rounded-lg overflow-hidden border-2 shrink-0 transition ${
                  i === indice ? 'border-accent' : 'border-transparent opacity-50 hover:opacity-100'
                }`}
              >
                <FotoRender foto={foto} classes="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
