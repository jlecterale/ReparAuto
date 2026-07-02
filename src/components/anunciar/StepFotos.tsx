'use client';

import { type MutableRefObject } from 'react';
import FotosEditor from '@/components/anunciar/FotosEditor';
import Button from '@/components/ui/Button';
import { MAX_FOTOS_CARRO } from '@/lib/constants';
import type { SpinAngle } from '@/lib/spin360';

interface StepFotosProps {
  fotos: string[];
  setFotos: (fotos: string[]) => void;
  onNext: () => void;
  onBack?: () => void;
  filesRef?: MutableRefObject<Map<string, File>>;
  angleByPhoto?: Record<string, SpinAngle>;
  onAngleByPhotoChange?: (angleByPhoto: Record<string, SpinAngle>) => void;
  /** Persist picked files to IndexedDB for draft recovery (see FotosEditor). */
  persistFiles?: boolean;
}

export default function StepFotos({
  fotos,
  setFotos,
  onNext,
  onBack,
  filesRef,
  angleByPhoto,
  onAngleByPhotoChange,
  persistFiles,
}: StepFotosProps) {
  return (
    <div>
      <h3 className="font-bold text-lg mb-3">📸 Fotos do carro</h3>
      <p className="text-sm text-fg-subtle mb-4">
        Carregue ou adicione fotos reais para mostrar o estado do veículo (máximo {MAX_FOTOS_CARRO} fotos, mínimo 1).
        Indique o ângulo de cada foto (frente, trás, laterais) para ativar a vista 360°.
      </p>

      <FotosEditor
        fotos={fotos}
        setFotos={setFotos}
        max={MAX_FOTOS_CARRO}
        filesRef={filesRef}
        angleByPhoto={angleByPhoto}
        onAngleByPhotoChange={onAngleByPhotoChange}
        persistFiles={persistFiles}
      />

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
