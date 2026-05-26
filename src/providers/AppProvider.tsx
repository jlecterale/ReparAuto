import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { initDatabase } from '@/lib/db';
import useAuth from '@/hooks/useAuth';
import useCarros from '@/hooks/useCarros';
import usePecas from '@/hooks/usePecas';
import useFavoritos from '@/hooks/useFavoritos';
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

  useEffect(() => {
    initDatabase().then(() => {
      setDbReady(true);
    });
  }, []);

  const auth = useAuth();
  const carros = useCarros();
  const pecas = usePecas();
  const favoritos = useFavoritos();

  const value: AppContextValue = {
    dbReady,
    auth,
    carros,
    pecas,
    favoritos,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
