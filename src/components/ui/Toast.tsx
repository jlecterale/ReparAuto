'use client';

import { X, CheckCircle, WarningCircle, Info, type Icon } from '@phosphor-icons/react';
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type ToastTipo = 'sucesso' | 'erro' | 'info';

interface ToastMessage {
  id: number;
  message: string;
  tipo: ToastTipo;
}

interface ToastContextValue {
  addToast: (message: string, tipo?: ToastTipo, duracao?: number) => void;
  sucesso: (msg: string) => void;
  erro: (msg: string) => void;
  info: (msg: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue | null {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, tipo: ToastTipo = 'info', duracao = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, tipo }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duracao);
  }, []);

  const sucesso = useCallback((msg: string) => addToast(msg, 'sucesso'), [addToast]);
  const erro = useCallback((msg: string) => addToast(msg, 'erro'), [addToast]);
  const info = useCallback((msg: string) => addToast(msg, 'info'), [addToast]);

  const cores: Record<ToastTipo, string> = {
    sucesso: 'bg-green-600',
    erro: 'bg-red-600',
    info: 'bg-brand-700',
  };

  const icons: Record<ToastTipo, Icon> = {
    sucesso: CheckCircle,
    erro: WarningCircle,
    info: Info,
  };

  return (
    <ToastContext.Provider value={{ addToast, sucesso, erro, info }}>
      {children}
      <div className="fixed bottom-20 md:bottom-4 right-4 z-[200] flex flex-col gap-2 max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`${cores[toast.tipo] || cores.info} text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-sm font-medium custom-toast page-enter`}
          >
            {(() => { const Ico = icons[toast.tipo] || icons.info; return <Ico size={18} weight="fill" className="shrink-0" />; })()}
            <span>{toast.message}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="ml-auto text-white/70 hover:text-white transition"
            >
              <X />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
