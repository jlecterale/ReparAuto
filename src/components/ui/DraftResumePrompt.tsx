'use client';

import Button from '@/components/ui/Button';

interface DraftResumePromptProps {
  /** Noun phrase inserted in the copy, e.g. "um anúncio de carro". */
  itemLabel: string;
  savedAt: number;
  onResume: () => void;
  onDiscard: () => void;
}

/** Modal asking whether to resume a locally saved listing draft. */
export default function DraftResumePrompt({ itemLabel, savedAt, onResume, onDiscard }: DraftResumePromptProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl page-enter">
        <h4 className="font-bold text-fg-heading mb-2">Continuar rascunho?</h4>
        <p className="text-sm text-fg-muted mb-2">
          Tem {itemLabel} por terminar, guardado em {new Date(savedAt).toLocaleDateString('pt-PT')}.
          Quer continuar onde parou?
        </p>
        <p className="text-xs text-fg-subtle mb-4">
          Os rascunhos ficam guardados apenas neste dispositivo/navegador.
        </p>
        <div className="flex gap-2 justify-end">
          <Button tipo="secundario" onClick={onDiscard}>
            Descartar
          </Button>
          <Button tipo="primario" onClick={onResume}>
            Continuar
          </Button>
        </div>
      </div>
    </div>
  );
}
