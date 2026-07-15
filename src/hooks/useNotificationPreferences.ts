'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getNotificationPreferences, updateNotificationPreferences } from '@/lib/db';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '@/lib/alerts';
import type { GrupoPreferencia, NotificationPreferences } from '@/types/alertas';

/**
 * Per-group × per-channel notification preferences on users/{uid}.notifPrefs.
 * Toggles are optimistic and roll back if the write fails; the Cloud
 * Functions read the same document before delivering anything.
 */
export default function useNotificationPreferences(uid: string | undefined) {
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [loading, setLoading] = useState(!!uid);

  useEffect(() => {
    if (!uid) {
      setPrefs(DEFAULT_NOTIFICATION_PREFERENCES);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getNotificationPreferences(uid)
      .then((stored) => {
        if (!cancelled) setPrefs(stored);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const toggle = useCallback(
    async (grupo: GrupoPreferencia, channel: 'inApp' | 'push') => {
      if (!uid) return;
      const previous = prefs;
      const next: NotificationPreferences = {
        ...prefs,
        [grupo]: { ...prefs[grupo], [channel]: !prefs[grupo][channel] },
      };
      setPrefs(next);
      try {
        await updateNotificationPreferences(uid, next);
      } catch (err) {
        console.error('[Alertas] Erro ao guardar preferências:', err);
        setPrefs(previous);
      }
    },
    [uid, prefs],
  );

  return useMemo(() => ({ prefs, loading, toggle }), [prefs, loading, toggle]);
}
