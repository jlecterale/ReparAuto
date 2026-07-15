'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import PecaForm, { type PecaFormDraft } from '@/components/pecas/PecaForm';
import DraftResumePrompt from '@/components/ui/DraftResumePrompt';
import { useAdDraft } from '@/hooks/useAdDraft';
import { releasePendingFiles } from '@/lib/pendingUploadFiles';

interface CriarPecaModalProps {
  show: boolean;
  onClose: () => void;
}

export default function CriarPecaModal({ show, onClose }: CriarPecaModalProps) {
  const [pecaDraft, setPecaDraft] = useState<PecaFormDraft | null>(null);

  // Prompt-only instance: PecaForm owns (and autosaves) the form state; this
  // offers to resume a draft left behind here or in the /anunciar flow.
  const pecaResume = useAdDraft<PecaFormDraft>({
    kind: 'peca',
    enabled: show,
    data: null,
    hasContent: false,
    onRestore: (draft) => setPecaDraft(draft.data),
    onDiscard: (draft) => releasePendingFiles([draft.data.foto]),
  });

  return (
    <Modal show={show} onClose={onClose} titulo="Anunciar Peça / Desmonte / Pedido" tamanho="lg">
      <PecaForm key={pecaDraft ? 'draft' : 'blank'} draft={pecaDraft} onSuccess={onClose} />
      {pecaResume.prompt && (
        <DraftResumePrompt
          itemLabel="um anúncio de peça"
          savedAt={pecaResume.prompt.savedAt}
          onDiscard={pecaResume.discard}
          onResume={pecaResume.resume}
        />
      )}
    </Modal>
  );
}
