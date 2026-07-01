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

// Prefixos para evitar colisões entre coleções
const FAV_PREFIX: Record<string, string> = {
  cars: 'car_',
  parts: 'part_',
  services: 'service_',
};

function prefixed(id: string, colecao: string): string {
  return (FAV_PREFIX[colecao] || 'car_') + id;
}

function colecaoFromPrefixed(prefixedId: string): string | null {
  for (const [colecao, prefix] of Object.entries(FAV_PREFIX)) {
    if (prefixedId.startsWith(prefix)) return colecao;
  }
  return null;
}

function rawId(prefixedId: string): string {
  for (const prefix of Object.values(FAV_PREFIX)) {
    if (prefixedId.startsWith(prefix)) return prefixedId.slice(prefix.length);
  }
  return prefixedId;
}

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

const defaultOnRequireLogin = () => {};

export default function useFavoritos(user: Usuario | null, onRequireLogin?: () => void) {
  const [favoritos, setFavoritosState] = useState<string[]>([]);
  // Bumped when the visitor changes their cookie consent, so anonymous local
  // favourites are re-read (or dropped) live — without a full page reload.
  const [consentVersion, setConsentVersion] = useState(0);

  useEffect(() => {
    function handleConsentChange() {
      setConsentVersion((v) => v + 1);
    }
    window.addEventListener('cookieConsentChanged', handleConsentChange);
    return () => window.removeEventListener('cookieConsentChanged', handleConsentChange);
  }, []);

  useEffect(() => {
    if (user?.uid) {
      const carregarFavs = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists() && userDoc.data().favoritos) {
            const raw = userDoc.data().favoritos as string[];
            // Migrate old unprefixed IDs to prefixed (assume cars)
            const migrados = raw.map((id: string) =>
              colecaoFromPrefixed(id) ? id : prefixed(id, 'cars')
            );
            if (migrados.some((m, i) => m !== raw[i])) {
              // Save migrated data back
              await setDoc(doc(db, 'users', user.uid), { favoritos: migrados }, { merge: true });
            }
            setFavoritosState(migrados);
          } else {
            setFavoritosState([]);
          }
        } catch {
          setFavoritosState(carregarLocal());
        }
      };
      carregarFavs();
    } else {
      const local = carregarLocal();
      // Migrate old unprefixed local IDs
      const migrados = local.map((id) =>
        colecaoFromPrefixed(id) ? id : prefixed(id, 'cars')
      );
      if (migrados.some((m, i) => m !== local[i])) {
        salvarLocal(migrados);
      }
      setFavoritosState(migrados);
    }
  }, [user?.uid, consentVersion]);

  useEffect(() => {
    const uid = user?.uid || null;

    async function replayQueue() {
      if (!navigator.onLine) return;
      await processQueue(uid, async (action) => {
        const itemId = action.payload.itemId as string;
        const colecao = (action.payload.colecao as string) || 'cars';
        if (action.type === 'favorito_add') {
          await incrementCampo(colecao, itemId, 'contagemFavoritos');
        } else if (action.type === 'favorito_remove') {
          await decrementCampo(colecao, itemId, 'contagemFavoritos');
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
    (id: string | number, colecaoParam: string = 'cars') => {
      const idStr = String(id);
      const prefixedId = prefixed(idStr, colecaoParam);
      const uid = user?.uid || null;

      // Check both prefixed and unprefixed (backward compat)
      const idxPrefixed = favoritos.indexOf(prefixedId);
      const idxUnprefixed = favoritos.indexOf(idStr);
      const alreadyFav = idxPrefixed > -1 || idxUnprefixed > -1;

      if (!uid && !alreadyFav) {
        (onRequireLogin || defaultOnRequireLogin)();
        return;
      }

      let nova: string[];
      if (alreadyFav) {
        // Remove whichever version exists
        nova = [...favoritos];
        if (idxPrefixed > -1) {
          nova.splice(idxPrefixed, 1);
        } else {
          nova.splice(idxUnprefixed, 1);
        }
        if (navigator.onLine) {
          decrementCampo(colecaoParam, idStr, 'contagemFavoritos');
        } else {
          enqueue({ uid, type: 'favorito_remove', payload: { itemId: idStr, colecao: colecaoParam } });
        }
      } else {
        nova = [...favoritos, prefixedId];
        if (navigator.onLine) {
          incrementCampo(colecaoParam, idStr, 'contagemFavoritos');
          getDoc(doc(db, colecaoParam, idStr)).then((snap) => {
            if (snap.exists()) {
              const data = snap.data();
              const criadorUid = data.criadorUid as string | undefined;
              if (criadorUid && criadorUid !== uid) {
                const tituloAnuncio =
                  colecaoParam === 'parts'
                    ? (data.titulo as string) || 'Peça'
                    : colecaoParam === 'services'
                      ? (data.nome as string) || 'Oficina'
                      : `${(data.marca as string) || ''} ${(data.modelo as string) || ''}`.trim() || 'Anúncio';
                const link =
                  colecaoParam === 'parts'
                    ? `/pecas/${idStr}`
                    : colecaoParam === 'services'
                      ? `/oficinas/detalhes/${idStr}`
                      : `/detalhes/${idStr}`;
                criarNotificacao(
                  criadorUid,
                  'info',
                  'Anúncio Favoritado ⭐️',
                  `Alguém favoritou o seu anúncio: ${tituloAnuncio}`,
                  link
                ).catch((err) => console.error('[Favoritos] Erro ao enviar notificação:', err));
              }
            }
          }).catch((err) => console.error('[Favoritos] Erro ao buscar dados do anúncio:', err));
        } else {
          enqueue({ uid, type: 'favorito_add', payload: { itemId: idStr, colecao: colecaoParam } });
        }
      }
      salvar(nova);
    },
    [favoritos, salvar, user?.uid, onRequireLogin]
  );

  const isFavorito = useCallback(
    (id: string | number): boolean => {
      const idStr = String(id);
      // Check both prefixed and unprefixed (backward compat)
      return favoritos.includes(idStr) ||
        Object.values(FAV_PREFIX).some((prefix) => favoritos.includes(prefix + idStr));
    },
    [favoritos]
  );

  const selectFavoritos = useCallback(
    (colecao: string): string[] => {
      const prefix = FAV_PREFIX[colecao] || 'car_';
      return favoritos
        .filter((f) => f.startsWith(prefix))
        .map((f) => f.slice(prefix.length));
    },
    [favoritos]
  );

  return useMemo(() => ({
    favoritos,
    toggleFavorito,
    isFavorito,
    count: favoritos.length,
    selectFavoritos,
  }), [favoritos, toggleFavorito, isFavorito, selectFavoritos]);
}
