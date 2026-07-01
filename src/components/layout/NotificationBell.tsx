'use client';

import { Bell } from '@phosphor-icons/react';
import Badge from '@/components/ui/Badge';
import { useState } from 'react';
import { useApp } from '@/providers/AppProvider';
import useNotificacoes from '@/hooks/useNotificacoes';
import NotificationInbox from './NotificationInbox';

export default function NotificationBell() {
  const { auth } = useApp();
  const { user } = auth;
  const { naoLidas } = useNotificacoes(user?.uid);
  const [open, setOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative text-white hover:text-accent transition p-1.5 flex items-center justify-center rounded-full hover:bg-white/10"
        aria-label="Notificações"
      >
        <Bell className="text-xl" />
        {naoLidas > 0 && (
          <Badge
            cor="red"
            variante="solid"
            className="absolute top-0.5 right-0.5 justify-center !px-1 min-w-[18px] min-h-[18px] !text-[10px] leading-none shadow"
          >
            {naoLidas > 99 ? '99+' : naoLidas}
          </Badge>
        )}
      </button>

      <NotificationInbox show={open} onClose={() => setOpen(false)} />
    </>
  );
}
