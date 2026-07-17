'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Car,
  PlusCircle,
  MagnifyingGlass,
  GearSix,
  ShieldCheck,
  Heart,
  Target,
  ChatCircleDots,
  SignOut,
  User,
  X,
  Wrench,
  ListChecks,
  Crown,
  Bell,
  ChartLineUp,
  GooglePlayLogo,
  AppleLogo,
  CaretDown,
  InstagramLogo,
  type Icon,
} from '@phosphor-icons/react';
import { useApp } from '@/providers/AppProvider';
import { useCountry } from '@/providers/CountryProvider';
import { COUNTRIES, COUNTRY_INFO } from '@/lib/country';
import NotificationInbox from './NotificationInbox';
import ChatInbox from '@/components/chat/ChatInbox';
import PlanosPremiumModal from '@/components/premium/PlanosPremiumModal';
import UserAvatar from '@/components/ui/UserAvatar';
import Badge from '@/components/ui/Badge';
import usePremiumConfig from '@/hooks/usePremiumConfig';
import useNotificacoes from '@/hooks/useNotificacoes';
import { PLAY_STORE_URL, APP_STORE_URL } from '@/lib/constants';

interface SidebarProps {
  /** Mobile drawer open state (ignored on desktop, where the rail is always visible). */
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { auth, chat } = useApp();
  const { country, setCountry } = useCountry();
  const premiumConfig = usePremiumConfig();
  const isPremiumActive = premiumConfig.impulsionamento || premiumConfig.oficinas || premiumConfig.leads;
  const pathname = usePathname();
  const { user, isLoggedIn, isAdmin, logout } = auth;
  const { mensagensNaoLidas } = chat;
  const { naoLidas } = useNotificacoes(user?.uid);

  const [showChatInbox, setShowChatInbox] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPlanos, setShowPlanos] = useState(false);
  const [marketOpen, setMarketOpen] = useState(false);
  const marketRef = useRef<HTMLDivElement>(null);

  // Close the market dropdown when clicking outside it.
  useEffect(() => {
    if (!marketOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (marketRef.current && !marketRef.current.contains(e.target as Node)) {
        setMarketOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [marketOpen]);

  const isActive = (path: string) => {
    if (!pathname) return false;
    if (path === '/app') return pathname === '/app' || pathname === '';
    return pathname.startsWith(path);
  };

  const navItems: { href: string; Icon: Icon; label: string }[] = [
    { href: '/app', Icon: Car, label: 'Anúncios' },
    { href: '/anunciar', Icon: PlusCircle, label: 'Vender' },
    { href: '/comprar', Icon: MagnifyingGlass, label: 'Comprar' },
    { href: '/pecas', Icon: GearSix, label: 'Peças & Desmonte' },
    { href: '/oficinas', Icon: Wrench, label: 'Oficinas & Mecânicos' },
    ...(isAdmin ? [{ href: '/admin', Icon: ShieldCheck, label: 'Admin' }] : []),
  ];

  const NavLink = ({ href, Icon, label }: { href: string; Icon: Icon; label: string }) => {
    const active = isActive(href);
    return (
      <Link
        href={href}
        onClick={onClose}
        className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold no-underline transition-all duration-200 ${
          active
            ? 'bg-accent text-white shadow-lg shadow-accent/30'
            : 'text-white/65 hover:text-white hover:bg-white/10'
        }`}
        aria-current={active ? 'page' : undefined}
      >
        <Icon
          size={20}
          weight={active ? 'fill' : 'regular'}
          className={`shrink-0 transition-colors ${
            active ? 'text-white' : 'text-white/55 group-hover:text-accent-bright'
          }`}
        />
        {label}
      </Link>
    );
  };

  const StoreLink = ({ href, Icon, label }: { href: string; Icon: Icon; label: string }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClose}
      className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold no-underline text-white/65 hover:text-white hover:bg-white/10 transition-all duration-200"
    >
      <Icon
        size={20}
        weight="fill"
        className="shrink-0 text-white/55 group-hover:text-accent-bright transition-colors"
      />
      {label}
    </a>
  );

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <p className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-white/35">{children}</p>
  );

  return (
    <>
      {/* Mobile drawer backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 flex flex-col border-r border-white/5
          bg-gradient-to-b from-brand-900 via-brand-900 to-primary-950 text-white shadow-2xl
          transition-transform duration-300 lg:translate-x-0 ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Brand */}
        <div className="relative flex items-center justify-center px-5 py-5 border-b border-white/5">
          <Link href="/app" onClick={onClose} className="flex items-center justify-center no-underline">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="RecarGarage" className="h-14 w-auto" />
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition"
            aria-label="Fechar menu"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto scrollbar-hide px-3 py-5 space-y-6">
          <div>
            <SectionLabel>Menu</SectionLabel>
            <div className="space-y-1">
              {navItems.map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </div>
          </div>

          <div>
            <SectionLabel>A minha conta</SectionLabel>
            <div className="space-y-1">
              <NavLink href="/favoritos" Icon={Heart} label="Favoritos" />

              {isLoggedIn && (
                <NavLink href="/perfil" Icon={ListChecks} label="Meus Anúncios" />
              )}

              {isLoggedIn && user?.tipoConta === 'profissional' && (
                <NavLink href="/painel" Icon={ChartLineUp} label="Painel Profissional" />
              )}

              {isLoggedIn && (
                <NavLink href="/minhas-intencoes" Icon={Target} label="Minhas Intenções" />
              )}

              {isLoggedIn && (
                <button
                  onClick={() => { setShowChatInbox(true); onClose(); }}
                  className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-white/65 hover:text-white hover:bg-white/10 transition-all duration-200"
                >
                  <ChatCircleDots size={20} className="shrink-0 text-white/55 group-hover:text-accent-bright transition-colors" />
                  Mensagens
                  {mensagensNaoLidas > 0 && (
                    <Badge cor="accent" variante="solid" className="ml-auto justify-center min-w-[20px] !text-[10px]">
                      {mensagensNaoLidas > 99 ? '99+' : mensagensNaoLidas}
                    </Badge>
                  )}
                </button>
              )}

              {isLoggedIn && (
                <button
                  onClick={() => { setShowNotifications(true); onClose(); }}
                  className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-white/65 hover:text-white hover:bg-white/10 transition-all duration-200"
                >
                  <Bell size={20} className="shrink-0 text-white/55 group-hover:text-accent-bright transition-colors" />
                  Notificações
                  {naoLidas > 0 && (
                    <Badge cor="accent" variante="solid" className="ml-auto justify-center min-w-[20px] !text-[10px]">
                      {naoLidas > 99 ? '99+' : naoLidas}
                    </Badge>
                  )}
                </button>
              )}
            </div>
          </div>

          <div>
            <SectionLabel>Obter a app</SectionLabel>
            <div className="space-y-1">
              <StoreLink href={PLAY_STORE_URL} Icon={GooglePlayLogo} label="Google Play" />
              <StoreLink href={APP_STORE_URL} Icon={AppleLogo} label="App Store" />
            </div>
          </div>

          {country === 'BR' && (
            <div>
              <SectionLabel>Siga-nos</SectionLabel>
              <div className="space-y-1">
                <a
                  href="https://www.instagram.com/recargaragebr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onClose}
                  className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold no-underline text-white/65 hover:text-white hover:bg-white/10 transition-all duration-200"
                >
                  <InstagramLogo
                    size={20}
                    className="shrink-0 text-white/55 group-hover:text-accent-bright transition-colors"
                  />
                  Instagram
                </a>
              </div>
            </div>
          )}
        </nav>

        {/* Premium CTA */}
        {isPremiumActive && (
          <div className="px-3 pb-3">
            <button
              onClick={() => { setShowPlanos(true); onClose(); }}
              className="group w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-extrabold no-underline transition-all duration-300
                bg-gradient-to-r from-warning-400/20 via-warning-300/15 to-secondary-500/20
                border border-warning-400/30 hover:border-warning-400/60
                text-warning-300 hover:text-warning-200
                hover:from-warning-400/30 hover:via-warning-300/25 hover:to-secondary-500/30
                hover:shadow-lg hover:shadow-warning-500/10"
            >
              <Crown size={22} weight="fill" className="shrink-0 text-warning-400 group-hover:text-warning-300 transition-colors" />
              <span>Planos Premium</span>
              <Badge cor="yellow" variante="solid" className="ml-auto !text-[9px] !px-1.5 !py-0">
                PRO
              </Badge>
            </button>
          </div>
        )}

        {/* Account */}
        <div className="border-t border-white/5 p-3">
          {isLoggedIn ? (
            <div className="flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-2xl p-2.5 border border-white/5 transition">
              <Link href="/perfil" onClick={onClose} className="flex items-center gap-3 no-underline min-w-0 flex-1">
                <UserAvatar user={user} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{user?.nome}</p>
                  <p className="text-xs text-white/40 truncate">Ver perfil</p>
                </div>
              </Link>
              <button
                onClick={() => { logout(); onClose(); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition flex-shrink-0"
                aria-label="Sair"
                title="Sair"
              >
                <SignOut size={18} />
              </button>
            </div>
          ) : (
            <Link
              href="/perfil"
              onClick={onClose}
              className="flex items-center justify-center gap-2 w-full bg-accent hover:bg-accent-hover text-white text-sm font-bold px-4 py-3 rounded-xl transition no-underline shadow-lg shadow-accent/30"
            >
              <User size={18} weight="bold" /> Entrar
            </Link>
          )}

          {/* Market switcher — anonymous visitors pick their market freely, and
              admins keep it too (they moderate every market). Regular signed-in
              accounts are bound to one market, so it's hidden entirely for them.
              Opens upward since it sits at the sidebar's foot. */}
          {(!isLoggedIn || isAdmin) && (
            <div ref={marketRef} className="relative mt-2">
              <button
                type="button"
                onClick={() => setMarketOpen((o) => !o)}
                aria-haspopup="listbox"
                aria-expanded={marketOpen}
                aria-label={`Mercado: ${COUNTRY_INFO[country].name}`}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <span aria-hidden="true" className="text-base leading-none">{COUNTRY_INFO[country].flag}</span>
                <span className="text-sm font-semibold">{COUNTRY_INFO[country].name}</span>
                {isAdmin && (
                  <Badge cor="accent" variante="solid" className="!text-[9px] !px-1.5 !py-0">ADMIN</Badge>
                )}
                <CaretDown
                  size={13}
                  weight="bold"
                  className={`ml-auto text-white/50 transition-transform duration-200 ${marketOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {marketOpen && (
                <ul
                  role="listbox"
                  aria-label="Escolher mercado"
                  className="absolute inset-x-0 bottom-full mb-1 z-20 rounded-xl bg-primary-950 border border-white/10 shadow-2xl overflow-hidden py-1"
                >
                  {COUNTRIES.map((code) => {
                    const info = COUNTRY_INFO[code];
                    const active = country === code;
                    return (
                      <li key={code} role="option" aria-selected={active}>
                        <button
                          type="button"
                          onClick={() => { setCountry(code); setMarketOpen(false); }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-semibold transition-colors ${
                            active ? 'bg-accent text-white' : 'text-white/70 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <span aria-hidden="true" className="text-base leading-none">{info.flag}</span>
                          {info.name}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      </aside>

      <ChatInbox show={showChatInbox} onClose={() => setShowChatInbox(false)} />
      <NotificationInbox show={showNotifications} onClose={() => setShowNotifications(false)} />
      <PlanosPremiumModal show={showPlanos} onClose={() => setShowPlanos(false)} />
    </>
  );
}
