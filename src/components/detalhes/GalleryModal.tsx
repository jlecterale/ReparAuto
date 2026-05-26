import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { renderFoto } from '@/lib/utils';

function FotoRender({ foto, classes }: { foto: string; classes?: string }) {
  const data = renderFoto(foto, classes);
  if (data.type === 'img') return <img src={data.src} className={data.classes} alt="Foto do anúncio" />;
  return <div className="w-full h-full flex items-center justify-center text-5xl">{data.emoji}</div>;
}

interface GalleryModalProps {
  show: boolean;
  onClose: () => void;
  fotos?: string[];
  indiceInicial?: number;
}

export default function GalleryModal({ show, onClose, fotos = [], indiceInicial = 0 }: GalleryModalProps) {
  const [indice, setIndice] = useState(indiceInicial);

  if (!show || fotos.length === 0) return null;

  return (
    <Modal show={show} onClose={onClose} titulo="Galeria de Fotos" tamanho="lg">
      <div className="space-y-3">
        <div className="w-full h-64 sm:h-96 rounded-xl overflow-hidden bg-slate-200">
          <FotoRender foto={fotos[indice]} classes="w-full h-full object-cover" />
        </div>

        {fotos.length > 1 && (
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setIndice((i) => (i > 0 ? i - 1 : fotos.length - 1))}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-semibold transition"
            >
              <i className="fa-solid fa-chevron-left mr-1"></i> Anterior
            </button>
            <span className="text-xs text-slate-500 font-medium">
              {indice + 1} / {fotos.length}
            </span>
            <button
              onClick={() => setIndice((i) => (i < fotos.length - 1 ? i + 1 : 0))}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-semibold transition"
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
