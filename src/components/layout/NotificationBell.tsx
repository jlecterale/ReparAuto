'use client';

import { Bell, CaretRight } from '@phosphor-icons/react';
import Badge from '@/components/ui/Badge';
import { useState, useRef, useEffect } from 'react';
import { useApp } from '@/providers/AppProvider';
import useNotificacoes from '@/hooks/useNotificacoes';
import { formatarData } from '@/lib/utils';

export default function NotificationBell() {
  const { auth } = useApp();
  const { user } = auth;
  const { notificacoes, naoLidas, marcarLida, marcarTodasLidas } = useNotificacoes(user?.uid);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative text-white hover:text-accent transition"
        aria-label="Notificações"
      >
        <Bell className="text-xl" />
        {naoLidas > 0 && (
          <Badge
            cor="red"
            variante="solid"
            className="absolute -top-1.5 -right-1.5 justify-center !px-1 min-w-[18px] min-h-[18px] !text-[10px] leading-none shadow"
          >
            {naoLidas > 99 ? '99+' : naoLidas}
          </Badge>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 max-h-[70vh] flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <h3 className="text-sm font-extrabold text-fg-heading">Notificações</h3>
            {naoLidas > 0 && (
              <button
                onClick={marcarTodasLidas}
                className="text-xs font-bold text-accent hover:text-accent-hover transition"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {notificacoes.length === 0 ? (
              <p className="text-center text-fg-subtle text-sm py-8">Nenhuma notificação.</p>
            ) : (
              notificacoes.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    marcarLida(n.id);
                    if (n.link) window.location.hash = n.link;
                    setOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition flex items-start gap-3 ${
                    !n.lida ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                    n.tipo === 'aprovado' ? 'bg-green-500' :
                    n.tipo === 'rejeitado' ? 'bg-red-500' : 'bg-blue-500'
                  } ${n.lida ? 'opacity-0' : ''}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-fg-heading">{n.titulo}</p>
                    <p className="text-xs text-fg-muted">{n.mensagem}</p>
                    <p className="text-[10px] text-fg-subtle mt-0.5">{formatarData(n.dataCriacao)}</p>
                  </div>
                  {n.link && (
                    <CaretRight className="text-slate-300 mt-1 text-xs flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
