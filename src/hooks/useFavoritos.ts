import { useState, useEffect, useCallback } from 'react';
import {
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Usuario } from '@/types/usuario';

const STORAGE_KEY = 'favs_reparauto';

function carregarLocal(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function salvarLocal(lista: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
}

export default function useFavoritos(user: Usuario | null) {
  const [favoritos, setFavoritosState] = useState<string[]>([]);

  useEffect(() => {
    if (user?.uid) {
      const carregarFavs = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists() && userDoc.data().favoritos) {
            setFavoritosState(userDoc.data().favoritos as string[]);
          } else {
            setFavoritosState([]);
          }
        } catch {
          setFavoritosState(carregarLocal());
        }
      };
      carregarFavs();
    } else {
      setFavoritosState(carregarLocal());
    }
  }, [user?.uid]);

  const salvar = useCallback(
    async (lista: string[]) => {
      setFavoritosState(lista);

      if (user?.uid) {
        try {
          const userRef = doc(db, 'users', user.uid);
          await setDoc(userRef, { favoritos: lista }, { merge: true });
        } catch (err) {
          console.error('[Favoritos] Erro ao salvar no Firestore:', err);
          salvarLocal(lista);
        }
      } else {
        salvarLocal(lista);
      }
    },
    [user?.uid]
  );

  const toggleFavorito = useCallback(
    (id: string | number) => {
      const idStr = String(id);
      const idx = favoritos.indexOf(idStr);
      let nova: string[];
      if (idx > -1) {
        nova = [...favoritos];
        nova.splice(idx, 1);
      } else {
        nova = [...favoritos, idStr];
      }
      salvar(nova);
    },
    [favoritos, salvar]
  );

  const isFavorito = useCallback(
    (id: string | number): boolean => favoritos.includes(String(id)),
    [favoritos]
  );

  return {
    favoritos,
    toggleFavorito,
    isFavorito,
    count: favoritos.length,
  };
}
