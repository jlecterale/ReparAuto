import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { formatarPreco, obterWhatsApp } from '@/lib/utils';
import { useApp } from '@/providers/AppProvider';
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
  const [mostrarTelefone, setMostrarTelefone] = useState(false);
  const { auth, chat } = useApp();
  const { user } = auth;
  const { abrirChat } = chat;

  if (!peca) return null;

  const config = tipoConfig[peca.tipo] || tipoConfig.venda;
  const telefone = peca.vendedorTelefone || peca.contacto;
  const email = peca.vendedorEmail || peca.criador;
  const whatsapp = obterWhatsApp(peca.vendedorWhatsApp, telefone);
  const temWhatsApp = !!whatsapp;
  const temTelefone = !!telefone;
  const temEmail = !!email;
  const temChat = !!user && user.email !== peca.criador;

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

        <div className="pt-3 border-t border-slate-200 space-y-3">
          <p className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <i className="fa-solid fa-user text-slate-400"></i>
            {peca.vendedorNome || peca.criador || 'Anónimo'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {temWhatsApp && (
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 px-4 rounded-xl transition text-sm"
              >
                <i className="fa-brands fa-whatsapp text-lg"></i>
                WhatsApp
              </a>
            )}

            {temTelefone && !mostrarTelefone && (
              <button
                onClick={() => setMostrarTelefone(true)}
                className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-accent font-semibold py-2.5 px-4 rounded-xl transition border border-accent text-sm"
              >
                <i className="fa-solid fa-phone"></i>
                Ver Telefone
              </button>
            )}

            {temTelefone && mostrarTelefone && (
              <a
                href={`tel:${telefone}`}
                className="flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white font-bold py-2.5 px-4 rounded-xl transition text-sm"
              >
                <i className="fa-solid fa-phone"></i>
                {telefone}
              </a>
            )}

            {temEmail && (
              <a
                href={`mailto:${email}`}
                className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold py-2.5 px-4 rounded-xl transition border border-slate-300 text-sm"
              >
                <i className="fa-solid fa-envelope"></i>
                Email
              </a>
            )}
          </div>

          {temChat && (
            <button
              onClick={() => abrirChat(peca.id, 'peca', peca.titulo, peca.criador, peca.vendedorNome || peca.criador || 'Vendedor')}
              className="flex items-center justify-center gap-2 w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2.5 px-4 rounded-xl transition text-sm"
            >
              <i className="fa-solid fa-comment-dots"></i>
              Enviar Mensagem (Chat Interno)
            </button>
          )}

          {!temChat && !user && (
            <a
              href="#/perfil"
              className="flex items-center justify-center gap-2 w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold py-2.5 px-4 rounded-xl transition text-sm"
            >
              <i className="fa-solid fa-right-to-bracket"></i>
              Faça login para enviar mensagem
            </a>
          )}
        </div>
      </div>
    </Modal>
  );
}
