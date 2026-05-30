'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { initDatabase } from '@/lib/db';
import useAuth from '@/hooks/useAuth';
import useCarros from '@/hooks/useCarros';
import usePecas from '@/hooks/usePecas';
import useFavoritos from '@/hooks/useFavoritos';
import { useChat } from '@/hooks/useChat';
import { useIntencoes } from '@/hooks/useIntencoes';
import LoginModal from '@/components/auth/LoginModal';
import type { AppContextValue } from '@/types/app';

const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp deve ser usado dentro de AppProvider');
  }
  return ctx;
}

export default function AppProvider({ children }: { children: ReactNode }) {
  const [dbReady, setDbReady] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginRedirectTo, setLoginRedirectTo] = useState<string | undefined>();

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    initDatabase().then(() => {
      setDbReady(true);
    });
  }, []);

  const auth = useAuth();
  const carros = useCarros();
  const pecas = usePecas();
  const favoritos = useFavoritos(auth.user);
  const chat = useChat(auth.user?.uid || null, auth.user?.nome || '');
  const intencoes = useIntencoes(auth.user?.uid || null);

  const { isLoggedIn, loading, profileCompleted } = auth;

  useEffect(() => {
    if (loading) return;
    if (isLoggedIn && !profileCompleted && pathname !== '/setup-perfil') {
      router.replace('/setup-perfil');
    }
  }, [isLoggedIn, loading, profileCompleted, router, pathname]);

  const openLoginModal = useCallback((redirectTo?: string) => {
    setLoginRedirectTo(redirectTo);
    setLoginModalOpen(true);
  }, []);

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

  const value: AppContextValue = {
    dbReady,
    auth,
    carros,
    pecas,
    favoritos,
    chat,
    intencoes,
    loginModal: {
      isOpen: loginModalOpen,
      openLoginModal,
      closeLoginModal,
    },
  };

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
