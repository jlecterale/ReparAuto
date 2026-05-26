import { useState, useEffect, useCallback } from 'react';
import {
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useApp } from '@/providers/AppProvider';

export default function useFavoritos() {
  const { auth } = useApp();
  const { user } = auth;

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
          setFavoritosState([]);
        }
      };
      carregarFavs();
    } else {
      try {
        const stored: string[] = JSON.parse(localStorage.getItem('favs_reparauto') || '[]');
        setFavoritosState(stored);
      } catch {
        setFavoritosState([]);
      }
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
        }
      } else {
        localStorage.setItem('favs_reparauto', JSON.stringify(lista));
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
