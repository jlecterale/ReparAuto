/**
 * Over-the-air (OTA) updates via `expo-updates` + EAS Update.
 *
 * Strategy — non-blocking, never intrusive:
 *   - On a cold start (and whenever the app returns to the foreground) we check
 *     the EAS Update endpoint for a newer JS bundle matching this binary's
 *     runtime (`runtimeVersion: { policy: 'fingerprint' }` in app.config.ts).
 *   - If one exists we download it silently. `expo-updates` then launches that
 *     newer bundle on the NEXT app start — we never force a mid-session reload,
 *     which would interrupt whatever the user is doing.
 *   - We surface a discreet info toast so the user knows a restart will apply it.
 *
 * Everything is wrapped in try/catch and gated on `Updates.isEnabled`, so it is
 * a complete no-op in development, in Expo Go, and on builds without OTA wired
 * up. An OTA failure must never crash or degrade the app.
 *
 * Native changes (new libraries, permissions, SDK bumps) cannot ship via OTA —
 * they change the fingerprint and require a new store build. See
 * `docs/OTA-UPDATES.md`.
 */
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Updates from 'expo-updates';
import { useToast } from '@/context/ToastContext';

export function useOTAUpdates(): void {
  const { showToast } = useToast();
  // Guards a check from overlapping itself, and stops us re-notifying once an
  // update has already been fetched and is pending for the next launch.
  const checking = useRef(false);
  const notified = useRef(false);

  useEffect(() => {
    // Disabled in dev / Expo Go / builds without expo-updates configured.
    if (__DEV__ || !Updates.isEnabled) return;

    async function checkForUpdate() {
      if (checking.current || notified.current) return;
      checking.current = true;
      try {
        const { isAvailable } = await Updates.checkForUpdateAsync();
        if (!isAvailable) return;

        const { isNew } = await Updates.fetchUpdateAsync();
        if (isNew && !notified.current) {
          notified.current = true;
          showToast(
            'Atualização disponível. Será aplicada ao reiniciar a app.',
            'info',
          );
        }
      } catch {
        // Offline, endpoint unreachable, incompatible runtime — stay silent and
        // keep running the bundle we already have. We retry on next foreground.
      } finally {
        checking.current = false;
      }
    }

    // Check once on mount, then whenever the app comes back to the foreground.
    checkForUpdate();
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') checkForUpdate();
    });
    return () => sub.remove();
  }, [showToast]);
}
