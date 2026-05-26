import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { initDatabase } from '@/lib/db';
import useAuth from '@/hooks/useAuth';
import useCarros from '@/hooks/useCarros';
import usePecas from '@/hooks/usePecas';
import useFavoritos from '@/hooks/useFavoritos';
import { useChat } from '@/hooks/useChat';
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
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    initDatabase().then(() => {
      setDbReady(true);
    });
  }, []);

  const auth = useAuth();
  const carros = useCarros();
  const pecas = usePecas();
  const favoritos = useFavoritos(auth.user);
  const chat = useChat(auth.user?.uid || null);

  const { isLoggedIn, loading, profileCompleted } = auth;

  useEffect(() => {
    if (loading) return;
    if (isLoggedIn && !profileCompleted && location.pathname !== '/setup-perfil') {
      navigate('/setup-perfil', { replace: true });
    }
  }, [isLoggedIn, loading, profileCompleted, navigate, location.pathname]);

  const value: AppContextValue = {
    dbReady,
    auth,
    carros,
    pecas,
    favoritos,
    chat,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
