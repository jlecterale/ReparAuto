import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCountry } from '@/context/CountryContext';
import { docCountry } from '@/lib/country';

/**
 * Accounts belong to one market (mirrors the web AppProvider sync): while
 * signed in, the active country is bound to the account's country (legacy
 * accounts resolve to PT) and the selector locks. Anonymous users keep the
 * free selector. Renders nothing — it only bridges Auth → Country.
 */
export function AccountCountrySync() {
  const { user, loading } = useAuth();
  const { setCountry, setLocked } = useCountry();
  const accountCountry = user ? docCountry(user) : null;

  useEffect(() => {
    if (loading) return;
    if (accountCountry) {
      setCountry(accountCountry);
      setLocked(true);
    } else {
      setLocked(false);
    }
  }, [accountCountry, loading, setCountry, setLocked]);

  return null;
}
