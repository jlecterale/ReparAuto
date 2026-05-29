'use client';

import { CaretLeft, CaretRight, HandPointing } from '@phosphor-icons/react';
import { useState, useCallback, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import FotoRender from '@/components/ui/FotoRender';
import useSwipe from '@/hooks/useSwipe';
import usePinchZoom from '@/hooks/usePinchZoom';

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

  useEffect(() => {
    if (!show) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [show, goNext, goPrev]);

  const swipeHandlers = useSwipe({ onLeft: goNext, onRight: goPrev });
  const pinchHandlers = usePinchZoom();

  useEffect(() => {
    pinchHandlers.reset();
  }, [indice, pinchHandlers]);

  const combinedTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) pinchHandlers.onTouchStart(e);
    else swipeHandlers.onTouchStart(e);
  }, [swipeHandlers, pinchHandlers]);

  const combinedTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) pinchHandlers.onTouchMove(e);
    else swipeHandlers.onTouchMove(e);
  }, [swipeHandlers, pinchHandlers]);

  const combinedTouchEnd = useCallback((e: React.TouchEvent) => {
    pinchHandlers.onTouchEnd(e);
    swipeHandlers.onTouchEnd(e);
  }, [swipeHandlers, pinchHandlers]);

  const combinedTouchCancel = useCallback((e: React.TouchEvent) => {
    pinchHandlers.onTouchCancel(e);
    swipeHandlers.onTouchCancel(e);
  }, [swipeHandlers, pinchHandlers]);

  if (!show || fotos.length === 0) return null;

  return (
    <Modal show={show} onClose={onClose} titulo="Galeria de Fotos" tamanho="lg">
      <div className="space-y-3">
        <div
          className="w-full h-64 sm:h-96 rounded-xl overflow-hidden bg-slate-200 touch-pan-y select-none"
          onTouchStart={combinedTouchStart}
          onTouchMove={combinedTouchMove}
          onTouchEnd={combinedTouchEnd}
          onTouchCancel={combinedTouchCancel}
        >
          <FotoRender foto={fotos[indice]} classes="w-full h-full object-cover" />
        </div>

        <p className="text-[10px] text-fg-subtle text-center block sm:hidden">
          <HandPointing className="mr-1" /> Deslize para navegar &middot; Belisque para zoom
        </p>

        {fotos.length > 1 && (
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={goPrev}
              className="bg-slate-100 hover:bg-slate-200 text-fg px-3 py-1.5 rounded-lg text-sm font-semibold transition"
              aria-label="Foto anterior"
            >
              <CaretLeft className="mr-1" /> Anterior
            </button>
            <span className="text-xs text-fg-subtle font-medium">
              {indice + 1} / {fotos.length}
            </span>
            <button
              onClick={goNext}
              className="bg-slate-100 hover:bg-slate-200 text-fg px-3 py-1.5 rounded-lg text-sm font-semibold transition"
              aria-label="Próxima foto"
            >
              Seguinte <CaretRight className="ml-1" />
            </button>
          </div>
        )}

        {fotos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {fotos.map((foto, i) => (
              <button
                key={i}
                onClick={() => setIndice(i)}
                className={`w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition ${
                  i === indice ? 'border-accent' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
                aria-label={`Foto ${i + 1}`}
                aria-current={i === indice ? 'true' : undefined}
              >
                <FotoRender foto={foto} classes="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
