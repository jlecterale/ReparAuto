import useInstallPrompt from '@/hooks/useInstallPrompt';

export default function InstallBanner() {
  const { canInstall, install, dismiss } = useInstallPrompt();

  if (!canInstall) return null;

  return (
    <div
      className="fixed bottom-20 md:bottom-4 left-4 right-4 z-50 mx-auto max-w-md bg-brand-800 text-white rounded-2xl shadow-2xl p-4 flex items-center gap-3 page-enter"
      role="status"
    >
      <i className="fa-solid fa-mobile-screen text-2xl text-accent flex-shrink-0"></i>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm">Instalar ReparAuto</p>
        <p className="text-xs text-brand-200">Acesso rápido direto do ecrã inicial.</p>
      </div>
      <button
        onClick={install}
        className="bg-accent hover:bg-accent-hover text-white text-xs font-bold px-3 py-2 rounded-xl transition flex-shrink-0"
      >
        Instalar
      </button>
      <button
        onClick={dismiss}
        className="text-brand-300 hover:text-white transition flex-shrink-0"
        aria-label="Fechar"
      >
        <i className="fa-solid fa-times"></i>
      </button>
    </div>
  );
}
