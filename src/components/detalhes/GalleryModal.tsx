import { useState, useCallback, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import FotoRender from '@/components/ui/FotoRender';
import useSwipe from '@/hooks/useSwipe';

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

  if (!show || fotos.length === 0) return null;

  return (
    <Modal show={show} onClose={onClose} titulo="Galeria de Fotos" tamanho="lg">
      <div className="space-y-3">
        <div
          className="w-full h-64 sm:h-96 rounded-xl overflow-hidden bg-slate-200 touch-pan-y select-none"
          {...swipeHandlers}
        >
          <FotoRender foto={fotos[indice]} classes="w-full h-full object-cover" />
        </div>

        {fotos.length > 1 && (
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={goPrev}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-semibold transition"
              aria-label="Foto anterior"
            >
              <i className="fa-solid fa-chevron-left mr-1"></i> Anterior
            </button>
            <span className="text-xs text-slate-500 font-medium">
              {indice + 1} / {fotos.length}
            </span>
            <button
              onClick={goNext}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-semibold transition"
              aria-label="Próxima foto"
            >
              Seguinte <i className="fa-solid fa-chevron-right ml-1"></i>
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
