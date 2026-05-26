import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { formatarPreco } from '@/lib/utils';
import type { Peca, TipoPeca } from '@/types/peca';

const tipoConfig: Record<TipoPeca, { cor: 'blue' | 'yellow' | 'gray'; icon: string; label: string }> = {
  venda: { cor: 'blue', icon: 'fa-solid fa-gears', label: 'Venda' },
  desmonte: { cor: 'yellow', icon: 'fa-solid fa-car', label: 'Desmonte' },
  procura: { cor: 'gray', icon: 'fa-solid fa-magnifying-glass', label: 'Procura-se' },
};

interface DetalhesPecaModalProps {
  show: boolean;
  onClose: () => void;
  peca: Peca | null;
}

export default function DetalhesPecaModal({ show, onClose, peca }: DetalhesPecaModalProps) {
  if (!peca) return null;

  const config = tipoConfig[peca.tipo] || tipoConfig.venda;

  return (
    <Modal show={show} onClose={onClose} titulo="Detalhes do Anúncio" tamanho="md">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge cor={config.cor}>
            <i className={`${config.icon} mr-1`}></i> {config.label}
          </Badge>
          {peca.preco && (
            <span className="text-2xl font-extrabold text-accent">
              {formatarPreco(peca.preco)}
            </span>
          )}
        </div>

        <h3 className="text-xl font-extrabold text-brand-900">{peca.titulo}</h3>

        <div className="grid grid-cols-2 gap-3 text-sm bg-slate-50 rounded-xl p-4">
          <div>
            <span className="text-xs font-semibold text-slate-500">Categoria</span>
            <p className="font-semibold text-brand-800">{peca.categoria}</p>
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500">Estado</span>
            <p className="font-semibold text-brand-800">{peca.estado}</p>
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500">Marca Compatível</span>
            <p className="font-semibold text-brand-800">{peca.marcaCarro}</p>
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500">Localização</span>
            <p className="font-semibold text-brand-800">{peca.local || 'Portugal'}</p>
          </div>
        </div>

        {peca.descricao && (
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">Descrição</span>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{peca.descricao}</p>
          </div>
        )}

        <div className="pt-3 border-t border-slate-200">
          <p className="text-xs font-semibold text-slate-500 mb-1">Contacto do Anunciante</p>
          <p className="text-sm text-brand-700">
            <i className="fa-solid fa-user mr-1 text-slate-400"></i>
            {peca.criador || 'Anónimo'}
          </p>
          {peca.contacto && (
            <p className="text-sm text-accent">
              <i className="fa-solid fa-phone mr-1"></i>
              {peca.contacto}
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
