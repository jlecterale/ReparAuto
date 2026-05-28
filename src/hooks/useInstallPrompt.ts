import { useState, useEffect, useCallback, useRef } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const REQUIRED_PAGE_VIEWS = 3;
const DISMISS_EXPIRY_DAYS = 14;

function isDismissed(): boolean {
  try {
    const raw = localStorage.getItem('pwa_install_dismissed');
    if (!raw) return false;
    const ts = parseInt(raw, 10);
    if (isNaN(ts)) return false;
    return Date.now() - ts < DISMISS_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function getPageViews(): number {
  try {
    return parseInt(sessionStorage.getItem('pwa_page_views') || '0', 10);
  } catch {
    return 0;
  }
}

function incrementPageViews(): number {
  const count = getPageViews() + 1;
  try { sessionStorage.setItem('pwa_page_views', String(count)); } catch {}
  return count;
}

export default function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(isDismissed);
  const [installed, setInstalled] = useState(false);
  const [engaged, setEngaged] = useState(() => getPageViews() >= REQUIRED_PAGE_VIEWS);
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    const count = incrementPageViews();
    if (count >= REQUIRED_PAGE_VIEWS) setEngaged(true);
  }, []);

  useEffect(() => {
    function handlePrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }
    function handleInstalled() {
      setInstalled(true);
      setDeferredPrompt(null);
    }
    window.addEventListener('beforeinstallprompt', handlePrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    setDeferredPrompt(null);
    try { localStorage.setItem('pwa_install_dismissed', String(Date.now())); } catch {}
  }, []);

  return {
    canInstall: !!deferredPrompt && !dismissed && !installed && engaged,
    install,
    dismiss,
  };
}
