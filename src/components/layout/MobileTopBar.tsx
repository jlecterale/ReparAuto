'use client';

import Link from 'next/link';
import { List, Heart } from '@phosphor-icons/react';
import NotificationBell from './NotificationBell';

export default function MobileTopBar({ onOpenMenu }: { onOpenMenu: () => void }) {
  return (
    <header className="lg:hidden sticky top-0 z-40 bg-brand-900 text-white shadow-lg">
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <button
          onClick={onOpenMenu}
          className="text-white hover:text-accent-bright transition p-1 -ml-1"
          aria-label="Abrir menu"
        >
          <List size={24} weight="bold" />
        </button>

        <Link href="/" className="flex items-center no-underline">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="ReparAuto" className="h-10 w-auto" />
        </Link>

        <div className="flex items-center gap-4">
          <NotificationBell />
          <Link href="/perfil" className="text-white hover:text-accent-bright transition" aria-label="Favoritos">
            <Heart size={22} />
          </Link>
        </div>
      </div>
    </header>
  );
}
