import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  COUNTRY_STORAGE_KEY,
  DEFAULT_COUNTRY,
  getActiveCountry,
  markCountryResolved,
  parseCountry,
  setActiveCountry,
  type Country,
} from '@/lib/country';

// GeoIP endpoint used to pre-select the market on the first launch. Free, no
// key; any failure just leaves the default (PT) in place.
const GEOIP_ENDPOINT = 'https://api.country.is/';

interface CountryContextValue {
  /** The active market: drives listing filters, vocabulary and location pickers. */
  country: Country;
  setCountry: (country: Country) => void;
  /** True while the market is bound to the signed-in account (selector disabled). */
  locked: boolean;
  /** Bound by AccountCountrySync: accounts belong to one market, so signing in locks it. */
  setLocked: (locked: boolean) => void;
}

const CountryContext = createContext<CountryContextValue | null>(null);

export function CountryProvider({ children }: { children: React.ReactNode }) {
  const [country, setCountryState] = useState<Country>(DEFAULT_COUNTRY);
  const [locked, setLocked] = useState(false);
  // The async first-launch resolution (AsyncStorage read / GeoIP fetch) must
  // never override a market that was meanwhile bound to the signed-in account.
  const lockedRef = useRef(false);
  useEffect(() => {
    lockedRef.current = locked;
  }, [locked]);

  const setCountry = useCallback((next: Country) => {
    setCountryState(next);
    setActiveCountry(next);
    AsyncStorage.setItem(COUNTRY_STORAGE_KEY, next).catch(() => {
      // Storage unavailable — the choice still applies to this session.
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadCountry() {
      let stored: Country | null = null;
      try {
        stored = parseCountry(await AsyncStorage.getItem(COUNTRY_STORAGE_KEY));
      } catch {
        stored = null;
      }
      if (cancelled) return;
      // Every settled branch below calls markCountryResolved so account
      // binding (getBindingCountry) never waits on an already-decided market.
      if (lockedRef.current) {
        // An account lock beat the first-launch resolution — it wins.
        markCountryResolved(getActiveCountry());
        return;
      }
      if (stored) {
        setCountryState(stored);
        markCountryResolved(stored);
        return;
      }
      // First launch: pre-select the user's market. Only a positive BR match
      // switches away from the default; the result is persisted either way so
      // detection runs once per device.
      try {
        const res = await fetch(GEOIP_ENDPOINT);
        const data: { country?: string } | null = res.ok ? await res.json() : null;
        const detected: Country = data?.country === 'BR' ? 'BR' : DEFAULT_COUNTRY;
        if (cancelled) return;
        if (lockedRef.current) {
          markCountryResolved(getActiveCountry());
          return;
        }
        setCountryState(detected);
        markCountryResolved(detected);
        await AsyncStorage.setItem(COUNTRY_STORAGE_KEY, detected);
      } catch {
        // Offline or blocked — settle on the current market (default PT);
        // detection runs again next launch.
        markCountryResolved(getActiveCountry());
      }
    }

    loadCountry();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<CountryContextValue>(
    () => ({ country, setCountry, locked, setLocked }),
    [country, setCountry, locked],
  );

  return <CountryContext.Provider value={value}>{children}</CountryContext.Provider>;
}

export function useCountry(): CountryContextValue {
  const ctx = useContext(CountryContext);
  if (!ctx) throw new Error('useCountry deve ser usado dentro de <CountryProvider>.');
  return ctx;
}
