import { useState } from 'react';
import { formatarPreco } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import type { Carro } from '@/types/carro';

export default function StatusPanel({ carro }: { carro: Carro | null }) {
  const [mostrarTelefone, setMostrarTelefone] = useState(false);

  if (!carro) return null;

  const email = carro.vendedorEmail || carro.criador;
  const temWhatsApp = !!carro.vendedorWhatsApp;
  const temTelefone = !!carro.vendedorTelefone;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm">
      <div className="text-center sm:text-left">
        <span className="text-3xl sm:text-4xl font-extrabold text-accent">
          {formatarPreco(carro.preco)}
        </span>
        {carro.preco <= 2000 && (
          <div className="mt-1">
            <Badge cor="accent">Low-Cost</Badge>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
        <p className="text-xs font-semibold text-slate-500 flex items-center gap-1">
          <i className="fa-solid fa-user text-slate-400"></i>
          {carro.vendedorNome || carro.criador || 'Anunciante'}
        </p>

        {temWhatsApp && (
          <a
            href={`https://wa.me/${carro.vendedorWhatsApp?.replace(/\s/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 px-4 rounded-xl transition text-sm"
          >
            <i className="fa-brands fa-whatsapp text-lg"></i>
            Falar por WhatsApp
          </a>
        )}

        {temTelefone && !mostrarTelefone && (
          <button
            onClick={() => setMostrarTelefone(true)}
            className="flex items-center justify-center gap-2 w-full bg-white hover:bg-slate-50 text-accent font-semibold py-2.5 px-4 rounded-xl transition border border-accent text-sm"
          >
            <i className="fa-solid fa-phone"></i>
            Ver Telefone
          </button>
        )}

        {temTelefone && mostrarTelefone && (
          <a
            href={`tel:${carro.vendedorTelefone}`}
            className="flex items-center justify-center gap-2 w-full bg-accent hover:bg-accent-hover text-white font-bold py-2.5 px-4 rounded-xl transition text-sm"
          >
            <i className="fa-solid fa-phone"></i>
            {carro.vendedorTelefone}
          </a>
        )}

        <a
          href={`mailto:${email}`}
          className="flex items-center justify-center gap-2 w-full bg-white hover:bg-slate-50 text-slate-700 font-semibold py-2.5 px-4 rounded-xl transition border border-slate-300 text-sm"
        >
          <i className="fa-solid fa-envelope"></i>
          Enviar Email
        </a>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100">
        <p className="text-xs text-slate-400 flex items-center gap-1">
          <i className="fa-solid fa-calendar"></i>
          Publicado em {new Date((carro.dataCriacao as any)?.toDate?.() || carro.dataCriacao || Date.now()).toLocaleDateString('pt-PT')}
        </p>
      </div>
    </div>
  );
}
