'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  MagnifyingGlass,
  PlusCircle,
  ChartLineUp,
  ShieldCheck,
  User,
  type Icon,
} from '@phosphor-icons/react';
import { useApp } from '@/providers/AppProvider';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { auth } = useApp();

  const isActive = (path: string) => {
    if (!pathname) return false;
    if (path === '/') return pathname === '/' || pathname === '';
    return pathname.startsWith(path);
  };

  const items: { path: string; Icon: Icon; label: string }[] = [
    { path: '/', Icon: MagnifyingGlass, label: 'Pesquisar' },
    { path: '/anunciar', Icon: PlusCircle, label: 'Anunciar' },
    { path: '/mercado', Icon: ChartLineUp, label: 'Mercado' },
    ...(auth.isAdmin ? [{ path: '/admin', Icon: ShieldCheck, label: 'Admin' }] : []),
    { path: '/perfil', Icon: User, label: 'Perfil' },
  ];

  return (
    <nav className="bottom-nav" id="bottomNav">
      {items.map((item) => {
        const active = isActive(item.path);
        return (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className={active ? 'active' : ''}
            aria-current={active ? 'page' : undefined}
          >
            <item.Icon size={24} weight={active ? 'fill' : 'regular'} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
