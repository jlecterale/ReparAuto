'use client';

import { useState, useEffect } from 'react';
import { GearSix, Car, MagnifyingGlass, User, WhatsappLogo, Phone, Envelope, ChatCircleDots, SignIn, type Icon } from '@phosphor-icons/react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { formatarPreco, obterWhatsApp } from '@/lib/utils';
import { getUserByEmail, incrementCampo } from '@/lib/db';
import { useApp } from '@/providers/AppProvider';
import type { Peca, TipoPeca } from '@/types/peca';

const tipoConfig: Record<TipoPeca, { cor: 'blue' | 'yellow' | 'gray'; Icon: Icon; label: string }> = {
  venda: { cor: 'blue', Icon: GearSix, label: 'Venda' },
  desmonte: { cor: 'yellow', Icon: Car, label: 'Desmonte' },
  procura: { cor: 'gray', Icon: MagnifyingGlass, label: 'Procura-se' },
};

interface DetalhesPecaModalProps {
  show: boolean;
  onClose: () => void;
  peca: Peca | null;
}

export default function DetalhesPecaModal({ show, onClose, peca }: DetalhesPecaModalProps) {
  const [mostrarTelefone, setMostrarTelefone] = useState(false);
  const [vendedorUid, setVendedorUid] = useState<string | null>(null);
  const { auth, chat, loginModal } = useApp();
  const { user } = auth;
  const { abrirChat } = chat;
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';

  useEffect(() => {
    if (!peca) return;
    if (peca.criadorUid) {
      setVendedorUid(peca.criadorUid);
    } else {
      getUserByEmail(peca.criador).then((u) => {
        if (u) setVendedorUid(u.uid);
      });
    }
    const key = `viewed_part_${peca.id}`;
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, '1');
      incrementCampo('parts', peca.id, 'visualizacoes');
    }
  }, [peca?.id]);

  if (!peca) return null;

  const config = tipoConfig[peca.tipo] || tipoConfig.venda;
  const telefone = peca.vendedorTelefone || peca.contacto;
  const email = peca.vendedorEmail || peca.criador;
  const whatsapp = obterWhatsApp(peca.vendedorWhatsApp, telefone);
  const temWhatsApp = !!whatsapp;
  const temTelefone = !!telefone;
  const temEmail = !!email;
  const temChat = !!user && !!vendedorUid && user.email !== peca.criador;

  return (
    <Modal show={show} onClose={onClose} titulo="Detalhes do Anúncio" tamanho="md">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge cor={config.cor}>
            <config.Icon className="mr-1" /> {config.label}
          </Badge>
          {peca.preco && (
            <span className="text-2xl font-extrabold text-accent">
              {formatarPreco(peca.preco)}
            </span>
          )}
        </div>

        <h3 className="text-xl font-extrabold text-fg-heading">{peca.titulo}</h3>

        <div className="grid grid-cols-2 gap-3 text-sm bg-slate-50 rounded-xl p-4">
          <div>
            <span className="text-xs font-semibold text-fg-subtle">Categoria</span>
            <p className="font-semibold text-fg-heading">{peca.categoria}</p>
          </div>
          <div>
            <span className="text-xs font-semibold text-fg-subtle">Estado</span>
            <p className="font-semibold text-fg-heading">{peca.estado}</p>
          </div>
          <div>
            <span className="text-xs font-semibold text-fg-subtle">Marca Compatível</span>
            <p className="font-semibold text-fg-heading">{peca.marcaCarro}</p>
          </div>
          <div>
            <span className="text-xs font-semibold text-fg-subtle">Localização</span>
            <p className="font-semibold text-fg-heading">{peca.local || 'Portugal'}</p>
          </div>
        </div>

        {peca.descricao && (
          <div>
            <span className="text-xs font-semibold text-fg-subtle block mb-1">Descrição</span>
            <p className="text-sm text-fg whitespace-pre-wrap">{peca.descricao}</p>
          </div>
        )}

        <div className="pt-3 border-t border-slate-200 space-y-3">
          <p className="text-xs font-semibold text-fg-subtle flex items-center gap-1">
            <User className="text-slate-400" />
            {peca.vendedorNome || peca.criador || 'Anónimo'}
          </p>

          {user ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {temWhatsApp && (
                  <a
                    href={`https://wa.me/${whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 px-4 rounded-xl transition text-sm"
                  >
                    <WhatsappLogo size={18} />
                    WhatsApp
                  </a>
                )}

                {temTelefone && !mostrarTelefone && (
                  <Button tipo="primario" icone={<Phone />} onClick={() => setMostrarTelefone(true)}>
                    Ver Telefone
                  </Button>
                )}

                {temTelefone && mostrarTelefone && (
                  <a
                    href={`tel:${telefone}`}
                    className="flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white font-bold py-2.5 px-4 rounded-xl transition text-sm"
                  >
                    <Phone />
                    {telefone}
                  </a>
                )}

                {temEmail && (
                  <a
                    href={`mailto:${email}`}
                    className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-fg font-semibold py-2.5 px-4 rounded-xl transition border border-slate-300 text-sm"
                  >
                    <Envelope />
                    Email
                  </a>
                )}
              </div>

              {temChat && (
                <Button
                  tipo="azul"
                  blocoCompleto
                  onClick={() => abrirChat(peca.id, 'peca', peca.titulo, vendedorUid!, peca.vendedorNome || peca.criador || 'Vendedor')}
                  icone={<ChatCircleDots />}
                >
                  Enviar Mensagem (Chat Interno)
                </Button>
              )}
            </>
          ) : (
            <button
              onClick={() => loginModal.openLoginModal(currentPath)}
              className="flex items-center justify-center gap-2 w-full bg-slate-100 hover:bg-slate-200 text-fg-muted font-semibold py-3 px-4 rounded-xl transition text-sm"
            >
              <SignIn />
              Faça login para ver os contactos
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
