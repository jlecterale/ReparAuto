'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { incrementCampo, decrementCampo, criarNotificacao } from '@/lib/db';
import { enqueue, processQueue } from '@/lib/offlineQueue';
import type { Usuario } from '@/types/usuario';

const STORAGE_KEY = 'favs_reparauto';

function podeUsarCookiesFuncionais(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const consentStr = localStorage.getItem('reparauto_cookie_consent');
    if (!consentStr) return false;
    const consent = JSON.parse(consentStr);
    return !!consent.funcionais;
  } catch {
    return false;
  }
}

function carregarLocal(): string[] {
  if (!podeUsarCookiesFuncionais()) return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function salvarLocal(lista: string[]): void {
  if (!podeUsarCookiesFuncionais()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
  } catch {}
}

export default function useFavoritos(user: Usuario | null, onRequireLogin?: () => void) {
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

  useEffect(() => {
    const uid = user?.uid || null;

    async function replayQueue() {
      if (!navigator.onLine) return;
      await processQueue(uid, async (action) => {
        const carId = action.payload.carId as string;
        if (action.type === 'favorito_add') {
          await incrementCampo('cars', carId, 'contagemFavoritos');
        } else if (action.type === 'favorito_remove') {
          await decrementCampo('cars', carId, 'contagemFavoritos');
        }
      });
    }

    window.addEventListener('online', replayQueue);
    replayQueue();
    return () => window.removeEventListener('online', replayQueue);
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
      const uid = user?.uid || null;

      if (!uid && idx === -1) {
        onRequireLogin?.();
        return;
      }

      let nova: string[];
      if (idx > -1) {
        nova = [...favoritos];
        nova.splice(idx, 1);
        if (navigator.onLine) {
          decrementCampo('cars', idStr, 'contagemFavoritos');
        } else {
          enqueue({ uid, type: 'favorito_remove', payload: { carId: idStr } });
        }
      } else {
        nova = [...favoritos, idStr];
        if (navigator.onLine) {
          incrementCampo('cars', idStr, 'contagemFavoritos');
          getDoc(doc(db, 'cars', idStr)).then((carSnap) => {
            if (carSnap.exists()) {
              const carData = carSnap.data();
              const criadorUid = carData.criadorUid;
              if (criadorUid && criadorUid !== uid) {
                criarNotificacao(
                  criadorUid,
                  'info',
                  'Anúncio Favoritado ⭐️',
                  `Alguém favoritou o seu anúncio: ${carData.marca} ${carData.modelo}`,
                  `/detalhes/${idStr}`
                ).catch((err) => console.error('[Favoritos] Erro ao enviar notificação:', err));
              }
            }
          }).catch((err) => console.error('[Favoritos] Erro ao buscar dados do carro:', err));
        } else {
          enqueue({ uid, type: 'favorito_add', payload: { carId: idStr } });
        }
      }
      salvar(nova);
    },
    [favoritos, salvar, user?.uid, onRequireLogin]
  );

  const isFavorito = useCallback(
    (id: string | number): boolean => favoritos.includes(String(id)),
    [favoritos]
  );

  return useMemo(() => ({
    favoritos,
    toggleFavorito,
    isFavorito,
    count: favoritos.length,
  }), [favoritos, toggleFavorito, isFavorito]);
}
