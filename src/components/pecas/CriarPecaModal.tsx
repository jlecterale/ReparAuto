import Modal from '@/components/ui/Modal';
import PecaForm from '@/components/pecas/PecaForm';

interface CriarPecaModalProps {
  show: boolean;
  onClose: () => void;
}

export default function CriarPecaModal({ show, onClose }: CriarPecaModalProps) {
  return (
    <Modal show={show} onClose={onClose} titulo="Anunciar Peça / Desmonte / Pedido" tamanho="lg">
      <PecaForm onSuccess={onClose} />
    </Modal>
  );
}
