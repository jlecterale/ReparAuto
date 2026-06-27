'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import useAuth from '@/hooks/useAuth';
import useCarros from '@/hooks/useCarros';
import usePecas from '@/hooks/usePecas';
import useFavoritos from '@/hooks/useFavoritos';
import useOficinas from '@/hooks/useOficinas';
import { useChat } from '@/hooks/useChat';
import { useIntencoes } from '@/hooks/useIntencoes';
import LoginModal from '@/components/auth/LoginModal';
import type { AppContextValue } from '@/types/app';
import { subscribePremiumConfig } from '@/lib/db';
import type { PremiumConfig } from '@/types/usuario';
import { logEvent } from 'firebase/analytics';
import { getAnalyticsInstance } from '@/lib/firebase';

const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp deve ser usado dentro de AppProvider');
  }
  return ctx;
}

export default function AppProvider({ children }: { children: ReactNode }) {
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginRedirectTo, setLoginRedirectTo] = useState<string | undefined>();

  const router = useRouter();
  const pathname = usePathname();

  const [premiumConfig, setPremiumConfig] = useState<PremiumConfig>({
    masterActive: true,
    impulsionamento: true,
    oficinas: true,
    leads: true,
  });

  useEffect(() => {
    const unsub = subscribePremiumConfig((config) => {
      setPremiumConfig(config);
    });
    return unsub;
  }, []);

  useEffect(() => {
    getAnalyticsInstance().then((analyticsInstance) => {
      if (analyticsInstance) {
        logEvent(analyticsInstance, 'page_view', {
          page_path: pathname,
          page_title: document.title,
        });
      }
    });
  }, [pathname]);

  const openLoginModal = useCallback((redirectTo?: string) => {
    setLoginRedirectTo(redirectTo);
    setLoginModalOpen(true);
  }, []);

  const auth = useAuth();
  // Only stream the heavy public collections on routes that render them.
  // Other routes still get the action methods (publicarCarro/publicarPeca);
  // add the route here if a new screen starts reading carros/pecas data.
  const needsCarros = pathname === '/' || pathname.startsWith('/favoritos');
  const needsPecas = pathname.startsWith('/pecas') || pathname.startsWith('/favoritos');
  const needsOficinas = pathname.startsWith('/oficinas') || pathname.startsWith('/favoritos');
  const carros = useCarros(needsCarros);
  const pecas = usePecas(needsPecas);
  const oficinas = useOficinas(needsOficinas);
  const favoritos = useFavoritos(auth.user, openLoginModal);
  const chat = useChat(auth.user?.uid || null, auth.user?.nome || '');
  const intencoes = useIntencoes(auth.user?.uid || null);

  const { isLoggedIn, loading, profileCompleted } = auth;

  useEffect(() => {
    if (loading) return;
    if (isLoggedIn && !profileCompleted && pathname !== '/setup-perfil') {
      router.replace('/setup-perfil');
    }
  }, [isLoggedIn, loading, profileCompleted, router, pathname]);

  const closeLoginModal = useCallback(() => {
    setLoginModalOpen(false);
    setLoginRedirectTo(undefined);
  }, []);

  const handleLoginSuccess = useCallback(() => {
    setLoginModalOpen(false);
    if (loginRedirectTo) {
      router.push(loginRedirectTo);
      setLoginRedirectTo(undefined);
    }
  }, [loginRedirectTo, router]);

  const value: AppContextValue = useMemo(() => ({
    auth,
    carros,
    pecas,
    favoritos,
    oficinas,
    chat,
    intencoes,
    loginModal: {
      isOpen: loginModalOpen,
      openLoginModal,
      closeLoginModal,
    },
    premiumConfig,
  }), [auth, carros, pecas, favoritos, oficinas, chat, intencoes, loginModalOpen, openLoginModal, closeLoginModal, premiumConfig]);

  return (
    <AppContext.Provider value={value}>
      {children}
      <LoginModal
        show={loginModalOpen}
        onClose={closeLoginModal}
        onSuccess={handleLoginSuccess}
      />
    </AppContext.Provider>
  );
}
