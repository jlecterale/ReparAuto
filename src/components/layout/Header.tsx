import { useState } from 'react';
import { useApp } from '@/providers/AppProvider';
import { CONCELHOS } from '@/lib/constants';
import NotificationBell from './NotificationBell';
import ChatInbox from '@/components/chat/ChatInbox';
import UserAvatar from '@/components/ui/UserAvatar';

export default function Header() {
  const { auth, carros, chat } = useApp();
  const { user, isLoggedIn, logout } = auth;
  const { searchQuery, setSearchQuery, advPriceMin, setAdvPriceMin, advPriceMax, setAdvPriceMax, advLocation, setAdvLocation, sortOrdem, setSortOrdem, filtroAtivo, setFiltroAtivo } = carros;
  const { mensagensNaoLidas } = chat;

  const [showChatInbox, setShowChatInbox] = useState(false);

  const limparFiltrosAvancados = () => {
    setAdvPriceMin(null);
    setAdvPriceMax(null);
    setAdvLocation('');
    setSortOrdem(null);
  };

  const [showAdvanced, setShowAdvanced] = useState(false);

  const chips = [
    { label: 'Destaques Low-Cost', value: 'lowcost' },
    { label: 'Até 500€', value: '500' },
    { label: 'Até 1.000€', value: '1000' },
    { label: 'Qualquer Valor', value: 'qualquer' },
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

        <div className="flex-1 max-w-md mx-4 hidden lg:block">
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Ex: Renault Clio, Peugeot 206..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-full bg-white/15 text-white placeholder-gray-300 border border-white/20 focus:outline-none focus:bg-white/25 focus:border-accent transition text-sm"
              />
            </div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="bg-white/10 hover:bg-white/25 border border-white/20 text-white px-3 py-2 rounded-full transition flex items-center justify-center gap-1 text-xs font-semibold flex-shrink-0"
            >
              <i className="fa-solid fa-sliders"></i> Filtros
            </button>
          </div>
        </div>

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

      <div className="lg:hidden max-w-6xl mx-auto px-4 pb-3 flex flex-wrap items-center gap-2">
        <div className="flex-1 min-w-[200px]">
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Ex: Renault Clio, Peugeot 206..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-full bg-white/15 text-white placeholder-gray-300 border border-white/20 focus:outline-none focus:bg-white/25 focus:border-accent transition text-sm"
              />
            </div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="bg-white/10 hover:bg-white/25 border border-white/20 text-white px-3 py-2 rounded-full transition flex items-center justify-center gap-1 text-xs font-semibold flex-shrink-0"
            >
              <i className="fa-solid fa-sliders"></i> Filtros
            </button>
          </div>
        </div>
      </div>

      {showAdvanced && (
        <div className="max-w-6xl mx-auto px-4 pb-3 pt-1 border-t border-white/10 text-white">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-brand-800/90 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-lg">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">Preço Mínimo (€)</label>
              <input
                type="number"
                placeholder="Mínimo"
                value={advPriceMin ?? ''}
                onChange={(e) => setAdvPriceMin(e.target.value ? Number(e.target.value) : null)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">Preço Máximo (€)</label>
              <input
                type="number"
                placeholder="Máximo"
                value={advPriceMax ?? ''}
                onChange={(e) => setAdvPriceMax(e.target.value ? Number(e.target.value) : null)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">Localização (Concelho)</label>
              <div className="flex gap-1.5">
                <div className="relative flex-1">
                  <input
                    type="text"
                    list="concelhos-list"
                    placeholder="Escrever concelho..."
                    value={advLocation}
                    onChange={(e) => setAdvLocation(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl pl-3 pr-8 py-1.5 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-accent"
                  />
                  <datalist id="concelhos-list">
                    {CONCELHOS.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                  <i className="fa-solid fa-location-dot absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                </div>
              </div>
            </div>
            <div className="sm:col-span-3 flex flex-wrap items-center gap-2 pt-2 border-t border-white/10 text-xs">
              <span className="block text-xs font-bold text-gray-300 mr-2">Ordenar por preço:</span>
              <button
                type="button"
                onClick={() => setSortOrdem('crescente')}
                className={`font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                  sortOrdem === 'crescente' ? 'bg-accent text-white' : 'bg-white/10 hover:bg-white/20 border border-white/20 text-white'
                }`}
              >
                <i className="fa-solid fa-arrow-trend-up"></i> Preço mais baixo
              </button>
              <button
                type="button"
                onClick={() => setSortOrdem('decrescente')}
                className={`font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                  sortOrdem === 'decrescente' ? 'bg-accent text-white' : 'bg-white/10 hover:bg-white/20 border border-white/20 text-white'
                }`}
              >
                <i className="fa-solid fa-arrow-trend-down"></i> Preço mais caro
              </button>
            </div>
            <div className="sm:col-span-3 flex justify-between items-center gap-2 pt-2 border-t border-white/10 text-xs">
              <button
                onClick={() => { limparFiltrosAvancados(); setShowAdvanced(false); }}
                className="border border-white/30 hover:bg-white/10 text-white font-bold px-4 py-2 rounded-xl transition"
              >
                Limpar
              </button>
              <button
                onClick={() => { setShowAdvanced(false); }}
                className="bg-accent hover:bg-accent-hover text-white font-bold px-4 py-2 rounded-xl transition"
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 pb-2 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
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

      <ChatInbox show={showChatInbox} onClose={() => setShowChatInbox(false)} />
    </header>
  );
}
