'use client';

import { Calendar, Envelope, Phone, User, WhatsappLogo } from '@phosphor-icons/react';
import { useState } from 'react';
import { formatarPreco, obterWhatsApp, gerarLinkWhatsApp } from '@/lib/utils';
import { docCountry } from '@/lib/country';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import type { Carro } from '@/types/carro';

export default function StatusPanel({ carro }: { carro: Carro | null }) {
  const [mostrarTelefone, setMostrarTelefone] = useState(false);

  if (!carro) return null;

  const whatsapp = obterWhatsApp(carro.vendedorWhatsApp, carro.vendedorTelefone, docCountry(carro));
  const email = carro.vendedorEmail || carro.criador;
  const temWhatsApp = !!whatsapp;
  const temTelefone = !!carro.vendedorTelefone;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm">
      <div className="text-center sm:text-left">
        <span className="text-3xl sm:text-4xl font-extrabold text-accent">
          {formatarPreco(carro.preco, docCountry(carro))}
        </span>
        {carro.preco <= 2000 && (
          <div className="mt-1">
            <Badge cor="accent" variante="solid">Low-Cost</Badge>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
        <p className="text-xs font-semibold text-fg-subtle flex items-center gap-1">
          <User className="text-slate-400" />
          {carro.vendedorNome || carro.criador || 'Anunciante'}
        </p>

        {temWhatsApp && (
          <a
            href={gerarLinkWhatsApp(whatsapp, `${carro.marca} ${carro.modelo}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 px-4 rounded-xl transition text-sm"
          >
            <WhatsappLogo className="text-lg" />
            Falar por WhatsApp
          </a>
        )}

        {temTelefone && !mostrarTelefone && (
          <Button tipo="primario" blocoCompleto onClick={() => setMostrarTelefone(true)} icone={<Phone />}>
            Ver Telefone
          </Button>
        )}

        {temTelefone && mostrarTelefone && (
          <a
            href={`tel:${carro.vendedorTelefone}`}
            className="flex items-center justify-center gap-2 w-full bg-accent hover:bg-accent-hover text-white font-bold py-2.5 px-4 rounded-xl transition text-sm"
          >
            <Phone />
            {carro.vendedorTelefone}
          </a>
        )}

        <a
          href={`mailto:${email}`}
          className="flex items-center justify-center gap-2 w-full bg-white hover:bg-slate-50 text-fg font-semibold py-2.5 px-4 rounded-xl transition border border-slate-300 text-sm"
        >
          <Envelope />
          Enviar Email
        </a>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100">
        <p className="text-xs text-fg-subtle flex items-center gap-1">
          <Calendar />
          Publicado em {new Date((carro.dataCriacao as any)?.toDate?.() || carro.dataCriacao || Date.now()).toLocaleDateString('pt-PT')}
        </p>
      </div>
    </div>
  );
}
