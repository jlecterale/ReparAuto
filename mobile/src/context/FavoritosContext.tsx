import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  bumpContador,
  getFavoritosRemoto,
  saveFavoritosRemoto,
} from '@/lib/db';
import { carregarFavoritosLocal, salvarFavoritosLocal } from '@/lib/storage';
import { useAuth } from './AuthContext';

interface FavoritosContextValue {
  favoritos: string[];
  toggleFavorito: (id: string) => void;
  isFavorito: (id: string) => boolean;
  count: number;
}

const FavoritosContext = createContext<FavoritosContextValue | null>(null);

/**
 * Mirrors the web `useFavoritos`: favourites live on the user document when
 * signed in, or in AsyncStorage when anonymous. The `cars.contagemFavoritos`
 * counter is bumped atomically (Firestore handles offline queueing natively).
 */
export function FavoritosProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [favoritos, setFavoritos] = useState<string[]>([]);
  // Guards against clobbering remote favourites with a stale empty list during
  // the brief window before the initial load resolves.
  const carregado = useRef(false);

  useEffect(() => {
    let active = true;
    carregado.current = false;
    (async () => {
      const lista = uid ? await getFavoritosRemoto(uid) : await carregarFavoritosLocal();
      if (!active) return;
      setFavoritos(lista);
      carregado.current = true;
    })();
    return () => {
      active = false;
    };
  }, [uid]);

  const persistir = useCallback(
    async (lista: string[]) => {
      if (uid) {
        try {
          await saveFavoritosRemoto(uid, lista);
        } catch {
          await salvarFavoritosLocal(lista);
        }
      } else {
        await salvarFavoritosLocal(lista);
      }
    },
    [uid],
  );

  const toggleFavorito = useCallback(
    (id: string) => {
      setFavoritos((atual) => {
        const existe = atual.includes(id);
        const nova = existe ? atual.filter((x) => x !== id) : [...atual, id];
        // Fire-and-forget the counter bump; ignore permission/offline errors.
        bumpContador('cars', id, 'contagemFavoritos', existe ? -1 : 1).catch(() => {});
        persistir(nova);
        return nova;
      });
    },
    [persistir],
  );

  const isFavorito = useCallback(
    (id: string) => favoritos.includes(id),
    [favoritos],
  );

  const value = useMemo<FavoritosContextValue>(
    () => ({ favoritos, toggleFavorito, isFavorito, count: favoritos.length }),
    [favoritos, toggleFavorito, isFavorito],
  );

  return (
    <FavoritosContext.Provider value={value}>{children}</FavoritosContext.Provider>
  );
}

export function useFavoritos(): FavoritosContextValue {
  const ctx = useContext(FavoritosContext);
  if (!ctx) throw new Error('useFavoritos deve ser usado dentro de <FavoritosProvider>.');
  return ctx;
}
