import { useCallback } from 'react';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

/**
 * Returns a guard for actions that require an account. If the user is signed
 * in it runs `action`; otherwise it opens the login modal. Keeps browsing open
 * to guests while protecting writes (favourite, announce, contact).
 */
export function useRequireAuth() {
  const { isLoggedIn } = useAuth();

  return useCallback(
    (action: () => void) => {
      if (isLoggedIn) {
        action();
      } else {
        router.push('/login');
      }
    },
    [isLoggedIn],
  );
}
