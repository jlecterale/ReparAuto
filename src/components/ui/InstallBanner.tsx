'use client';

import { DeviceMobile, X } from '@phosphor-icons/react';
import useInstallPrompt from '@/hooks/useInstallPrompt';
import Button from '@/components/ui/Button';

export default function InstallBanner() {
  const { canInstall, install, dismiss } = useInstallPrompt();

  if (!canInstall) return null;

  return (
    <div
      className="fixed bottom-20 md:bottom-4 left-4 right-4 z-50 mx-auto max-w-md bg-brand-800 text-white rounded-2xl shadow-2xl p-4 flex items-center gap-3 page-enter"
      role="status"
    >
      <DeviceMobile className="text-2xl text-accent flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm">Instalar ReparAuto</p>
        <p className="text-xs text-brand-200">Acesso rápido direto do ecrã inicial.</p>
      </div>
      <Button
        tipo="primario"
        tamanho="sm"
        onClick={install}
        className="flex-shrink-0"
      >
        Instalar
      </Button>
      <button
        onClick={dismiss}
        className="text-brand-300 hover:text-white transition flex-shrink-0"
        aria-label="Fechar"
      >
        <X />
      </button>
    </div>
  );
}
