'use client';

import { UploadSimple, X } from '@phosphor-icons/react';
import { useRef } from 'react';
import { EMOJIS_CARRO } from '@/lib/constants';
import Button from '@/components/ui/Button';

interface StepFotosProps {
  fotos: string[];
  setFotos: (fotos: string[]) => void;
  onNext: () => void;
  onBack?: () => void;
}

export default function StepFotos({ fotos, setFotos, onNext, onBack }: StepFotosProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processarFotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const novasFotos: string[] = [];
    files.forEach((file) => {
      if (novasFotos.length + fotos.length >= 6) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        novasFotos.push(ev.target?.result as string);
        if (novasFotos.length === files.length || novasFotos.length + fotos.length >= 6) {
          setFotos([...fotos, ...novasFotos].slice(0, 6));
        }
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const adicionarEmoji = () => {
    const emoji = EMOJIS_CARRO[Math.floor(Math.random() * EMOJIS_CARRO.length)];
    setFotos([...fotos, emoji].slice(0, 6));
  };

  const removerFoto = (index: number) => {
    setFotos(fotos.filter((_, i) => i !== index));
  };

  return (
    <div>
      <h3 className="font-bold text-lg mb-3">📸 Fotos do carro</h3>
      <p className="text-sm text-fg-subtle mb-4">
        Carregue ou adicione fotos reais para mostrar o estado do veículo (máximo 6 fotos, mínimo 1).
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <label className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-fg font-semibold px-4 py-3 rounded-xl text-xs cursor-pointer transition flex items-center justify-center gap-2 border-dashed">
          <UploadSimple /> Carregar Imagens Reais
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            multiple
            onChange={processarFotos}
          />
        </label>
        <Button
          tipo="secundario"
          tamanho="lg"
          type="button"
          onClick={adicionarEmoji}
        >
          🎲 Adicionar Emoji Rápido
        </Button>
      </div>

      {fotos.length === 0 && (
        <p className="text-xs text-red-500 mb-4 block">
          Por favor, adicione pelo menos 1 foto do veículo (ficheiro real ou emoji rápido).
        </p>
      )}

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
        {fotos.map((foto, i) => (
          <div key={i} className="relative group">
            {foto.startsWith('data:') || foto.startsWith('http') ? (
              <img src={foto} alt={`Foto ${i + 1}`} className="w-full h-20 object-cover rounded-lg border border-slate-200" />
            ) : (
              <div className="w-full h-20 flex items-center justify-center text-3xl bg-slate-50 rounded-lg border border-slate-200">
                {foto}
              </div>
            )}
            <button
              type="button"
              onClick={() => removerFoto(i)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow"
            >
              <X />
            </button>
          </div>
        ))}
        {Array.from({ length: Math.max(0, 6 - fotos.length) }).map((_, i) => (
          <div
            key={`empty-${i}`}
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-20 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-fg-subtle text-xs cursor-pointer hover:bg-slate-50 transition"
          >
            {fotos.length + i + 1}
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        {onBack && (
          <Button
            tipo="secundario"
            tamanho="lg"
            onClick={onBack}
            className="flex-1"
          >
            Voltar
          </Button>
        )}
        <Button
          tipo="primario"
          tamanho="lg"
          onClick={onNext}
          disabled={fotos.length === 0}
          className="flex-1"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}
