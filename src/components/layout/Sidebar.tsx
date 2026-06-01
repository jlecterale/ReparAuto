'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Car,
  PlusCircle,
  MagnifyingGlass,
  GearSix,
  ChartLineUp,
  Calculator,
  ShieldCheck,
  Heart,
  Target,
  ChatCircleDots,
  SignOut,
  User,
  X,
  Wrench,
  ListChecks,
  type Icon,
} from '@phosphor-icons/react';
import { useApp } from '@/providers/AppProvider';
import NotificationBell from './NotificationBell';
import ChatInbox from '@/components/chat/ChatInbox';
import UserAvatar from '@/components/ui/UserAvatar';
import Badge from '@/components/ui/Badge';

interface SidebarProps {
  /** Mobile drawer open state (ignored on desktop, where the rail is always visible). */
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { auth, chat } = useApp();
  const pathname = usePathname();
  const { user, isLoggedIn, isAdmin, logout } = auth;
  const { mensagensNaoLidas } = chat;

  const [showChatInbox, setShowChatInbox] = useState(false);

  const isActive = (path: string) => {
    if (!pathname) return false;
    if (path === '/') return pathname === '/' || pathname === '';
    return pathname.startsWith(path);
  };

  const navItems: { href: string; Icon: Icon; label: string }[] = [
    { href: '/', Icon: Car, label: 'Anúncios' },
    { href: '/anunciar', Icon: PlusCircle, label: 'Vender' },
    { href: '/comprar', Icon: MagnifyingGlass, label: 'Comprar' },
    { href: '/pecas', Icon: GearSix, label: 'Peças & Desmonte' },
    { href: '/oficinas', Icon: Wrench, label: 'Oficinas & Mecânicos' },
    { href: '/mercado', Icon: ChartLineUp, label: 'Mercado' },
    { href: '/avaliar-veiculo', Icon: Calculator, label: 'Avaliar Veículo' },
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
          <Link href="/" onClick={onClose} className="flex items-center justify-center no-underline">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="ReparAuto" className="h-14 w-auto" />
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
                <div className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-white/65 hover:text-white hover:bg-white/10 transition-all duration-200">
                  <span className="w-5 flex items-center justify-center text-white/55 group-hover:text-accent-bright transition-colors [&_button]:!text-current">
                    <NotificationBell />
                  </span>
                  Notificações
                </div>
              )}
            </div>
          </div>
        </nav>

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
        </div>
      </aside>

      <ChatInbox show={showChatInbox} onClose={() => setShowChatInbox(false)} />
    </>
  );
}
