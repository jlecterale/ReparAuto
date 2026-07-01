/**
 * Client-side persistence for the welcome onboarding tour (the intent router).
 *
 * Two concerns:
 *  - "seen" flag    → show the welcome screen only once per visitor. The key is
 *    versioned so a future redesign can deliberately re-introduce it.
 *  - "pending intent" → the destination a visitor chose BEFORE signing up. A
 *    brand-new account is force-routed through /setup-perfil (see AppProvider),
 *    so we stash the chosen creation flow here and resume it once the profile
 *    is complete.
 *
 * Every access is wrapped in try/catch — localStorage can be disabled, full, or
 * blocked by cookie settings (matching useInstallPrompt / useFavoritos).
 */

const SEEN_KEY = 'reparauto_onboarding_v1';
const PENDING_INTENT_KEY = 'reparauto_pending_intent';

// A chosen intent only needs to survive the signup → setup-perfil detour, which
// takes minutes. Expire quickly so a long-abandoned choice never resurfaces to
// hijack an unrelated later login (AppProvider also drops stale intents).
const PENDING_INTENT_TTL_MS = 10 * 60 * 1000;

export function hasSeenOnboarding(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

export function markOnboardingSeen(): void {
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    /* ignore — storage unavailable */
  }
}

export function setPendingIntent(path: string): void {
  try {
    localStorage.setItem(PENDING_INTENT_KEY, JSON.stringify({ path, ts: Date.now() }));
  } catch {
    /* ignore — storage unavailable */
  }
}

export function getPendingIntent(): string | null {
  try {
    const raw = localStorage.getItem(PENDING_INTENT_KEY);
    if (!raw) return null;
    const { path, ts } = JSON.parse(raw) as { path?: string; ts?: number };
    if (!path || typeof ts !== 'number' || Date.now() - ts > PENDING_INTENT_TTL_MS) {
      clearPendingIntent();
      return null;
    }
    return path;
  } catch {
    return null;
  }
}

export function clearPendingIntent(): void {
  try {
    localStorage.removeItem(PENDING_INTENT_KEY);
  } catch {
    /* ignore — storage unavailable */
  }
}
