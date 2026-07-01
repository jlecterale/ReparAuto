'use client';

import { useState, useEffect } from 'react';
import { GearSix, Car, MagnifyingGlass, User, WhatsappLogo, Phone, Envelope, ChatCircleDots, SignIn, type Icon } from '@phosphor-icons/react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import ShareButton from '@/components/ui/ShareButton';
import { formatarPreco, obterWhatsApp } from '@/lib/utils';
import { getUserByEmail, incrementCampo, recordDailyMetric, countProcurasForPeca } from '@/lib/db';
import { useApp } from '@/providers/AppProvider';
import { formatCompatibilityEntry } from '@/lib/compatibility';
import CompatibleVehicles from '@/components/pecas/CompatibleVehicles';
import PriceReferenceBadge from '@/components/pecas/PriceReferenceBadge';
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
  const [procurasCount, setProcurasCount] = useState<number>(0);
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
      // Owners previewing their own listing don't count as interest.
      if (peca.criadorUid && peca.criadorUid !== user?.uid) {
        recordDailyMetric(peca.criadorUid, 'view');
      }
    }
  }, [peca?.id]);

  useEffect(() => {
    if (!peca || peca.tipo === 'procura') {
      setProcurasCount(0);
      return;
    }
    let cancelled = false;
    countProcurasForPeca(peca).then((n) => {
      if (!cancelled) setProcurasCount(n);
    });
    return () => { cancelled = true; };
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

        <div className="flex items-start justify-between gap-2">
          <h3 className="text-xl font-extrabold text-fg-heading">{peca.titulo}</h3>
          <ShareButton
            title={`${peca.titulo} - RecarGarage`}
            text={peca.preco ? `${peca.titulo} - ${formatarPreco(peca.preco)}` : peca.titulo}
            url={typeof window !== 'undefined' ? `${window.location.origin}/pecas/${peca.id}` : `/pecas/${peca.id}`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <PriceReferenceBadge peca={peca} />
          {procurasCount > 0 && (
            <div className="inline-flex items-center gap-1.5 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg px-3 py-1.5 text-xs font-bold">
              <i className="fa-solid fa-fire"></i>
              {procurasCount === 1
                ? '1 pessoa procura esta peça'
                : `${procurasCount} pessoas procuram esta peça`}
            </div>
          )}
        </div>

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
          {peca.numeroOEM && (
            <div className="col-span-2">
              <span className="text-xs font-semibold text-slate-500">Referência OEM</span>
              <p className="font-mono font-semibold text-brand-800 text-sm">{peca.numeroOEM}</p>
            </div>
          )}
        </div>

        {peca.compatibilidades && peca.compatibilidades.length > 0 && (
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-2">
              <i className="fa-solid fa-car-side text-accent mr-1"></i>
              Compatível com
            </span>
            <ul className="flex flex-wrap gap-1.5">
              {peca.compatibilidades.map((entry, i) => (
                <li
                  key={i}
                  className="text-[11px] font-semibold bg-orange-50 border border-orange-200 text-brand-800 rounded-full px-2.5 py-1"
                >
                  {formatCompatibilityEntry(entry)}
                </li>
              ))}
            </ul>
          </div>
        )}

        <CompatibleVehicles peca={peca} />

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

          {!temChat && !user && (
            <button
              onClick={() => loginModal.openLoginModal(currentPath)}
              className="flex items-center justify-center gap-2 w-full bg-slate-100 hover:bg-slate-200 text-fg-muted font-semibold py-2.5 px-4 rounded-xl transition text-sm"
            >
              <SignIn />
              Faça login para enviar mensagem
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
