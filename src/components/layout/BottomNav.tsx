'use client';

import { usePathname, useRouter } from 'next/navigation';
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

  const items = [
    { path: '/', icon: 'fa-solid fa-magnifying-glass', label: 'Pesquisar' },
    { path: '/anunciar', icon: 'fa-solid fa-plus-circle', label: 'Anunciar' },
    { path: '/mercado', icon: 'fa-solid fa-chart-line', label: 'Mercado' },
    ...(auth.isAdmin ? [{ path: '/admin', icon: 'fa-solid fa-shield-halved', label: 'Admin' }] : []),
    { path: '/perfil', icon: 'fa-solid fa-user', label: 'Perfil' },
  ];

  return (
    <nav className="bottom-nav" id="bottomNav">
      {items.map((item) => (
        <button
          key={item.path}
          onClick={() => router.push(item.path)}
          className={isActive(item.path) ? 'active' : ''}
        >
          <i className={item.icon}></i>
          {item.label}
        </button>
      ))}
    </nav>
  );
}
