import { useState } from 'react';
import { useApp } from '@/providers/AppProvider';
import { obterWhatsApp } from '@/lib/utils';
import type { Carro } from '@/types/carro';

export default function ContactSection({ carro }: { carro: Carro | null }) {
  const [mostrarTelefone, setMostrarTelefone] = useState(false);
  const { auth, chat } = useApp();
  const { user } = auth;
  const { abrirChat } = chat;

  if (!carro) return null;

  const whatsapp = obterWhatsApp(carro.vendedorWhatsApp, carro.vendedorTelefone);
  const telefone = carro.vendedorTelefone;
  const email = carro.vendedorEmail || carro.criador;
  const temWhatsApp = !!whatsapp;
  const temTelefone = !!telefone;
  const temEmail = !!email;
  const temChat = !!user && user.email !== carro.criador;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm">
      <h3 className="font-extrabold text-brand-900 mb-4 flex items-center gap-2">
        <i className="fa-solid fa-address-card text-accent"></i> Contactar Vendedor
      </h3>

      <div className="flex items-center gap-2 text-sm text-brand-700 mb-4">
        <i className="fa-solid fa-user text-slate-400"></i>
        <span className="font-semibold">{carro.vendedorNome || carro.criador || 'Anunciante'}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {temWhatsApp && (
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-xl transition text-sm"
          >
            <i className="fa-brands fa-whatsapp text-lg"></i>
            WhatsApp
          </a>
        )}

        {temTelefone && !mostrarTelefone && (
          <button
            onClick={() => setMostrarTelefone(true)}
            className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-accent font-semibold py-3 px-4 rounded-xl transition border border-accent text-sm"
          >
            <i className="fa-solid fa-phone"></i>
            Ver Telefone
          </button>
        )}

        {temTelefone && mostrarTelefone && (
          <a
            href={`tel:${carro.vendedorTelefone}`}
            className="flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white font-bold py-3 px-4 rounded-xl transition text-sm"
          >
            <i className="fa-solid fa-phone"></i>
            {carro.vendedorTelefone}
          </a>
        )}

        {temEmail && (
          <a
            href={`mailto:${email}`}
            className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 rounded-xl transition border border-slate-300 text-sm"
          >
            <i className="fa-solid fa-envelope"></i>
            Enviar Email
          </a>
        )}

        {temChat && (
          <button
            onClick={() => abrirChat(carro.id, 'carro', `${carro.marca} ${carro.modelo}`, carro.criador, carro.vendedorNome || carro.criador || 'Vendedor')}
            className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-xl transition text-sm col-span-full"
          >
            <i className="fa-solid fa-comment-dots"></i>
            Enviar Mensagem (Chat Interno)
          </button>
        )}

        {!temChat && !user && (
          <a
            href="#/perfil"
            className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold py-3 px-4 rounded-xl transition text-sm col-span-full"
          >
            <i className="fa-solid fa-right-to-bracket"></i>
            Faça login para enviar mensagem
          </a>
        )}
      </div>
    </div>
  );
}
