import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '@/providers/AppProvider';
import NotificationBell from './NotificationBell';
import ChatInbox from '@/components/chat/ChatInbox';
import UserAvatar from '@/components/ui/UserAvatar';

export default function Header() {
  const { auth, carros, chat } = useApp();
  const location = useLocation();
  const { user, isLoggedIn, logout } = auth;
  const { filtroAtivo, setFiltroAtivo } = carros;
  const { mensagensNaoLidas } = chat;

  const [showChatInbox, setShowChatInbox] = useState(false);

  const chips = [
    { label: 'Todas as Ofertas', value: 'qualquer' },
    { label: 'Destaques Low-Cost', value: 'lowcost' },
    { label: 'Até 500€', value: '500' },
    { label: 'Até 1.000€', value: '1000' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-brand-900 text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <a href="#/" className="flex items-center gap-2 flex-shrink-0 no-underline text-white">
          <i className="fa-solid fa-wrench text-accent text-2xl"></i>
          <span className="font-extrabold text-xl tracking-tight">Repar<span className="text-accent">Auto</span></span>
          <span className="text-xs bg-accent text-white px-2 py-0.5 rounded-full font-semibold hidden sm:inline">PT</span>
        </a>

        <nav className="hidden md:flex items-center gap-5 text-xs font-bold uppercase tracking-wider ml-4 flex-shrink-0">
          <a href="#/" className="hover:text-accent transition flex items-center gap-1 text-accent">
            <i className="fa-solid fa-car"></i> Anúncios
          </a>
          <a href="#/anunciar" className="hover:text-accent transition flex items-center gap-1 text-white">
            <i className="fa-solid fa-circle-plus"></i> Vender
          </a>
          <a href="#/pecas" className="hover:text-accent transition flex items-center gap-1 text-white">
            <i className="fa-solid fa-gears"></i> Peças & Desmonte
          </a>
          {auth.isAdmin && (
            <a href="#/admin" className="hover:text-accent transition flex items-center gap-1 text-white">
              <i className="fa-solid fa-shield-halved"></i> Admin
            </a>
          )}
        </nav>

        <div className="flex items-center gap-4 flex-shrink-0">
          {isLoggedIn && (
            <button
              onClick={() => setShowChatInbox(true)}
              className="relative text-white hover:text-accent transition"
              aria-label="Mensagens"
            >
              <i className="fa-solid fa-comment-dots text-xl"></i>
              {mensagensNaoLidas > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-accent text-white text-[10px] font-bold w-4.5 h-4.5 flex items-center justify-center rounded-full min-w-[18px] min-h-[18px] leading-none">
                  {mensagensNaoLidas > 99 ? '99+' : mensagensNaoLidas}
                </span>
              )}
            </button>
          )}
          <NotificationBell />
          <a href="#/perfil" className="relative text-white hover:text-accent transition" aria-label="Favoritos">
            <i className="fa-solid fa-heart text-xl"></i>
          </a>
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <a href="#/perfil" className="hidden sm:flex items-center gap-2 no-underline group">
                <UserAvatar user={user} size="sm" />
                <span className="text-xs text-white/70 group-hover:text-accent transition">{user?.nome}</span>
              </a>
              <button
                onClick={logout}
                className="text-xs border border-white/30 px-3 py-1.5 rounded-full hover:bg-white/10 transition"
              >
                <i className="fa-solid fa-right-from-bracket mr-1"></i> Sair
              </button>
            </div>
          ) : (
            <a
              href="#/perfil"
              className="text-xs border border-white/30 px-3 py-1.5 rounded-full hover:bg-white/10 transition no-underline text-white"
            >
              <i className="fa-solid fa-user mr-1"></i> Entrar
            </a>
          )}
        </div>
      </div>

      {location.pathname === '/' && (
      <div className="max-w-6xl mx-auto px-4 pb-2 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide touch-pan-x overscroll-x-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
        {chips.map((chip) => (
          <button
            key={chip.value}
            onClick={() => setFiltroAtivo(filtroAtivo === chip.value ? null : chip.value as 'lowcost' | '500' | '1000' | 'reparar' | 'qualquer')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition flex-shrink-0 ${
              filtroAtivo === chip.value
                ? 'bg-accent text-white border-accent'
                : 'bg-white/15 text-white border-white/20 hover:bg-white/25'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>
      )}

      <ChatInbox show={showChatInbox} onClose={() => setShowChatInbox(false)} />
    </header>
  );
}
