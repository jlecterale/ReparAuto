'use client';

import { type MutableRefObject } from 'react';
import FotosEditor from '@/components/anunciar/FotosEditor';
import Button from '@/components/ui/Button';
import { MAX_FOTOS_CARRO } from '@/lib/constants';

interface StepFotosProps {
  fotos: string[];
  setFotos: (fotos: string[]) => void;
  onNext: () => void;
  onBack?: () => void;
  filesRef?: MutableRefObject<Map<string, File>>;
}

export default function StepFotos({ fotos, setFotos, onNext, onBack, filesRef }: StepFotosProps) {
  return (
    <div>
      <h3 className="font-bold text-lg mb-3">📸 Fotos do carro</h3>
      <p className="text-sm text-fg-subtle mb-4">
        Carregue ou adicione fotos reais para mostrar o estado do veículo (máximo {MAX_FOTOS_CARRO} fotos, mínimo 1).
      </p>

      <FotosEditor fotos={fotos} setFotos={setFotos} max={MAX_FOTOS_CARRO} filesRef={filesRef} />

      {fotos.length === 0 && (
        <p className="text-xs text-red-500 mt-4 block">
          Por favor, adicione pelo menos 1 foto do veículo (ficheiro real ou emoji rápido).
        </p>
      )}

      <div className="flex gap-3 mt-6">
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
