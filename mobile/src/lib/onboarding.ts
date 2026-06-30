import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Persistence for the welcome onboarding tour (the intent router).
 *
 * The chosen intent is carried to the signup screen via navigation params, so
 * the only thing we persist is whether the welcome has already been shown. The
 * key is versioned so a future redesign can deliberately re-introduce it.
 *
 * Both calls are best-effort and swallow errors (storage can be unavailable),
 * matching the pattern in src/lib/storage.ts.
 */
const SEEN_KEY = 'reparauto_onboarding_v1';

export async function hasSeenOnboarding(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(SEEN_KEY)) === '1';
  } catch {
    return false;
  }
}

export async function markOnboardingSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(SEEN_KEY, '1');
  } catch {
    // best-effort; ignore storage failures.
  }
}
