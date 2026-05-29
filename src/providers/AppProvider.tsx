'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { initDatabase } from '@/lib/db';
import useAuth from '@/hooks/useAuth';
import useCarros from '@/hooks/useCarros';
import usePecas from '@/hooks/usePecas';
import useFavoritos from '@/hooks/useFavoritos';
import { useChat } from '@/hooks/useChat';
import { useIntencoes } from '@/hooks/useIntencoes';
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

  const value: AppContextValue = {
    dbReady,
    auth,
    carros,
    pecas,
    favoritos,
    chat,
    intencoes,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
