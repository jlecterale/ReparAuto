'use client';

import { CircleNotch, Bell, X, CaretRight } from '@phosphor-icons/react';
import { useApp } from '@/providers/AppProvider';
import useNotificacoes from '@/hooks/useNotificacoes';
import { formatarData } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface NotificationInboxProps {
  show: boolean;
  onClose: () => void;
}

export default function NotificationInbox({ show, onClose }: NotificationInboxProps) {
  const { auth } = useApp();
  const { user } = auth;
  const router = useRouter();
  const { notificacoes, naoLidas, marcarLida, marcarTodasLidas, loading } = useNotificacoes(user?.uid);

  if (!show || !user) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden border border-slate-100 animate-scale-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-fg-heading text-sm">Notificações</h3>
            {naoLidas > 0 && (
              <span className="bg-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                {naoLidas}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {naoLidas > 0 && (
              <button
                onClick={marcarTodasLidas}
                className="text-xs font-bold text-accent hover:text-accent-hover transition-colors font-semibold"
              >
                Marcar todas como lidas
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-fg-muted transition-colors p-1"
              aria-label="Fechar"
            >
              <X className="text-xl" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <CircleNotch className="animate-spin text-accent text-2xl" />
            </div>
          ) : notificacoes.length === 0 ? (
            <div className="text-center py-12 text-fg-subtle">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <Bell className="text-2xl text-slate-400" />
              </div>
              <p className="text-sm font-bold text-fg-heading">Sem notificações</p>
              <p className="text-xs text-neutral-400 mt-1 max-w-[280px] mx-auto">
                Quando receber alertas de compras, vendas ou mensagens, eles aparecerão aqui.
              </p>
            </div>
          ) : (
            notificacoes.map((n) => (
              <button
                key={n.id}
                onClick={async () => {
                  await marcarLida(n.id);
                  if (n.link) {
                    router.push(n.link);
                  }
                  onClose();
                }}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3.5 ${
                  !n.lida
                    ? 'bg-blue-50/40 border-blue-100 hover:bg-blue-50/70 hover:border-blue-200'
                    : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100/50 hover:border-slate-350'
                }`}
              >
                <span
                  className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm ${
                    n.tipo === 'aprovado' ? 'bg-success-500' :
                    n.tipo === 'rejeitado' ? 'bg-danger-500' :
                    n.tipo === 'alerta' ? 'bg-accent' :
                    n.tipo === 'preco' ? 'bg-warning-500' : 'bg-primary-500'
                  } ${n.lida ? 'opacity-0' : ''}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-fg-heading truncate">{n.titulo}</p>
                    <p className="text-[10px] text-fg-subtle flex-shrink-0 font-medium">{formatarData(n.dataCriacao)}</p>
                  </div>
                  <p className="text-xs text-fg-muted mt-1 leading-relaxed break-words">{n.mensagem}</p>
                </div>
                {n.link && (
                  <CaretRight className="text-slate-400 mt-1 text-xs flex-shrink-0 self-center" />
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
