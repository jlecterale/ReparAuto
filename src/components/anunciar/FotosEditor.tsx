'use client';

import { useRef, useState } from 'react';
import { CaretLeft, CaretRight, UploadSimple, Spinner, X } from '@phosphor-icons/react';
import { EMOJIS_CARRO, MAX_FOTO_SIZE_BYTES, MAX_FOTO_SIZE_MB } from '@/lib/constants';
import { comprimirImagem } from '@/lib/compressImage';

interface FotosEditorProps {
  fotos: string[];
  setFotos: (fotos: string[]) => void;
  max?: number;
  mostrarEmoji?: boolean;
  /** Show a "Capa" badge on the first photo. Defaults to true when max > 1. */
  mostrarCapa?: boolean;
  /** Ref to collect pending File objects keyed by blob URL (for deferred upload). */
  filesRef?: React.MutableRefObject<Map<string, File>>;
}

const reordenar = (fotos: string[], from: number, to: number): string[] => {
  if (from === to || from < 0 || to < 0 || from >= fotos.length || to >= fotos.length) {
    return fotos;
  }
  const copia = [...fotos];
  const [movida] = copia.splice(from, 1);
  copia.splice(to, 0, movida);
  return copia;
};

export default function FotosEditor({
  fotos,
  setFotos,
  max = 6,
  mostrarEmoji = true,
  mostrarCapa,
  filesRef,
}: FotosEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [comprimindo, setComprimindo] = useState(false);

  const exibirCapa = mostrarCapa ?? max > 1;
  const podeReordenar = max > 1 && fotos.length > 1;

  const processarFotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (files.length === 0) return;

    const espacoLivre = Math.max(0, max - fotos.length);
    const candidatos = files.slice(0, espacoLivre);
    const tooMany = files.length > espacoLivre;

    const oversize = candidatos.filter((f) => f.size > MAX_FOTO_SIZE_BYTES);
    const validos = candidatos.filter((f) => f.size <= MAX_FOTO_SIZE_BYTES);

    if (validos.length === 0) {
      if (oversize.length > 0) {
        setErro(`${oversize.length === 1 ? 'Uma imagem' : `${oversize.length} imagens`} excedeu o limite de ${MAX_FOTO_SIZE_MB} MB.`);
      } else if (tooMany) {
        setErro(`Só pode adicionar até ${max} fotos no total.`);
      }
      return;
    }

    setComprimindo(true);
    setErro(null);

    try {
      const compressed = await Promise.all(validos.map(comprimirImagem));

      const newPhotos: string[] = [];
      for (const blob of compressed) {
        const compressedFile = new File([blob], `foto_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const url = URL.createObjectURL(compressedFile);
        newPhotos.push(url);
        filesRef?.current.set(url, compressedFile);
      }

      setFotos([...fotos, ...newPhotos].slice(0, max));

      if (oversize.length > 0) {
        setErro(`${oversize.length === 1 ? 'Uma imagem' : `${oversize.length} imagens`} excedeu o limite original de ${MAX_FOTO_SIZE_MB} MB mas foi comprimida.`);
      }
    } catch {
      setErro('Erro ao comprimir imagem. Tente novamente.');
    } finally {
      setComprimindo(false);
    }
  };

  const adicionarEmoji = () => {
    const emoji = EMOJIS_CARRO[Math.floor(Math.random() * EMOJIS_CARRO.length)];
    setFotos([...fotos, emoji].slice(0, max));
    setErro(null);
  };

  const removerFoto = (index: number) => {
    const removed = fotos[index];
    if (removed?.startsWith('blob:')) {
      URL.revokeObjectURL(removed);
      filesRef?.current.delete(removed);
    }
    setFotos(fotos.filter((_, i) => i !== index));
    setErro(null);
  };

  const moverFoto = (from: number, to: number) => {
    setFotos(reordenar(fotos, from, to));
  };

  const handleDragStart = (i: number) => (e: React.DragEvent<HTMLDivElement>) => {
    setDraggingIndex(i);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(i));
  };

  const handleDragOver = (i: number) => (e: React.DragEvent<HTMLDivElement>) => {
    if (draggingIndex === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (i !== dragOverIndex) setDragOverIndex(i);
  };

  const handleDrop = (i: number) => (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const fromStr = e.dataTransfer.getData('text/plain');
    const from = fromStr ? Number(fromStr) : draggingIndex;
    if (from !== null && !Number.isNaN(from)) moverFoto(from, i);
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  const podeAdicionar = fotos.length < max;
  const alturaFoto = max === 1 ? 'h-40' : 'h-20';

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-3">
        <label
          className={`flex-1 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-fg font-semibold px-4 py-3 rounded-xl text-xs transition flex items-center justify-center gap-2 border-dashed ${
            podeAdicionar && !comprimindo ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'
          }`}
        >
          {comprimindo ? <Spinner className="animate-spin" /> : <UploadSimple />}
          {comprimindo ? 'A comprimir…' : 'Carregar Imagens Reais'}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            multiple={max > 1}
            disabled={!podeAdicionar || comprimindo}
            onChange={processarFotos}
          />
        </label>
        {mostrarEmoji && (
          <button
            type="button"
            onClick={adicionarEmoji}
            disabled={!podeAdicionar}
            className="bg-white hover:bg-neutral-50 text-fg-subtle font-medium px-4 py-3 rounded-xl text-xs transition border border-neutral-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🎲 Adicionar Emoji Rápido
          </button>
        )}
      </div>

      <p className="text-[11px] text-fg-muted mb-3">
        Máximo {max} {max === 1 ? 'foto' : 'fotos'} · até {MAX_FOTO_SIZE_MB} MB cada.
        {exibirCapa && ' A primeira foto será a capa do anúncio.'}
        {podeReordenar && ' Arraste para reordenar.'}
      </p>

      {erro && (
        <p className="text-xs text-red-500 mb-3" role="alert">
          {erro}
        </p>
      )}

      <div className={`grid gap-3 ${max === 1 ? 'grid-cols-1' : 'grid-cols-3 sm:grid-cols-6'}`}>
        {fotos.map((foto, i) => {
          const isImg = foto.startsWith('data:') || foto.startsWith('blob:') || foto.startsWith('http');
          const isDragging = draggingIndex === i;
          const isDragOver = dragOverIndex === i && draggingIndex !== i;
          return (
            <div
              key={i}
              draggable={podeReordenar}
              onDragStart={podeReordenar ? handleDragStart(i) : undefined}
              onDragOver={podeReordenar ? handleDragOver(i) : undefined}
              onDrop={podeReordenar ? handleDrop(i) : undefined}
              onDragEnd={podeReordenar ? handleDragEnd : undefined}
              className={`relative group transition ${podeReordenar ? 'cursor-move' : ''} ${
                isDragging ? 'opacity-40' : ''
              } ${isDragOver ? 'ring-2 ring-accent rounded-lg' : ''}`}
            >
              {isImg ? (
                <img
                  src={foto}
                  alt={`Foto ${i + 1}`}
                  draggable={false}
                  className={`w-full object-cover rounded-lg border border-neutral-200 ${alturaFoto} pointer-events-none`}
                />
              ) : (
                <div
                  className={`w-full flex items-center justify-center text-3xl bg-neutral-50 rounded-lg border border-neutral-200 ${alturaFoto} pointer-events-none`}
                >
                  {foto}
                </div>
              )}

              {exibirCapa && i === 0 && (
                <span className="absolute bottom-1 left-1 bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded pointer-events-none">
                  Capa
                </span>
              )}

              {podeReordenar && (
                <div className="absolute bottom-1 right-1 flex gap-0.5">
                  <button
                    type="button"
                    onClick={() => moverFoto(i, i - 1)}
                    disabled={i === 0}
                    aria-label={`Mover foto ${i + 1} para a esquerda`}
                    className="w-5 h-5 bg-white/90 text-fg rounded flex items-center justify-center shadow border border-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white"
                  >
                    <CaretLeft size={10} weight="bold" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moverFoto(i, i + 1)}
                    disabled={i === fotos.length - 1}
                    aria-label={`Mover foto ${i + 1} para a direita`}
                    className="w-5 h-5 bg-white/90 text-fg rounded flex items-center justify-center shadow border border-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white"
                  >
                    <CaretRight size={10} weight="bold" />
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => removerFoto(i)}
                aria-label={`Remover foto ${i + 1}`}
                className="absolute -top-1.5 -right-1.5 w-6 h-6 sm:w-5 sm:h-5 bg-danger-600 text-white rounded-full flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition shadow"
              >
                <X size={12} weight="bold" />
              </button>
            </div>
          );
        })}
        {Array.from({ length: Math.max(0, max - fotos.length) }).map((_, i) => (
          <button
            type="button"
            key={`empty-${i}`}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full border-2 border-dashed border-neutral-200 rounded-lg flex items-center justify-center text-fg-muted text-xs cursor-pointer hover:bg-neutral-50 transition ${alturaFoto}`}
          >
            {fotos.length + i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
