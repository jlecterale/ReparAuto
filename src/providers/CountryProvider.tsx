'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo, type ReactNode } from 'react';
import {
  COUNTRY_STORAGE_KEY,
  DEFAULT_COUNTRY,
  parseCountry,
  type Country,
} from '@/lib/country';

// GeoIP endpoint used to pre-select the market on the first visit. Free, no
// key, CORS-enabled; any failure just leaves the default (PT) in place.
const GEOIP_ENDPOINT = 'https://api.country.is/';

export interface CountryContextValue {
  /** The active market: drives listing filters, vocabulary and location pickers. */
  country: Country;
  setCountry: (country: Country) => void;
  /** True while the market is bound to the signed-in account (selector disabled). */
  locked: boolean;
  /** Bound by AppProvider: accounts belong to one market, so signing in locks it. */
  setLocked: (locked: boolean) => void;
}

const CountryContext = createContext<CountryContextValue | null>(null);

export function useCountry(): CountryContextValue {
  const ctx = useContext(CountryContext);
  if (!ctx) {
    throw new Error('useCountry deve ser usado dentro de CountryProvider');
  }
  return ctx;
}

export default function CountryProvider({ children }: { children: ReactNode }) {
  // Starts at the default on both server and client so hydration matches;
  // the stored preference (or GeoIP) is applied right after mount.
  const [country, setCountryState] = useState<Country>(DEFAULT_COUNTRY);
  const [locked, setLocked] = useState(false);
  // The async GeoIP result must never override a market that was meanwhile
  // bound to the signed-in account.
  const lockedRef = useRef(false);
  useEffect(() => {
    lockedRef.current = locked;
  }, [locked]);

  const setCountry = useCallback((next: Country) => {
    setCountryState(next);
    try {
      window.localStorage.setItem(COUNTRY_STORAGE_KEY, next);
    } catch {
      // Storage unavailable (private mode) — the choice still applies to this session.
    }
  }, []);

  useEffect(() => {
    let stored: Country | null = null;
    try {
      stored = parseCountry(window.localStorage.getItem(COUNTRY_STORAGE_KEY));
    } catch {
      stored = null;
    }
    if (stored) {
      if (!lockedRef.current) setCountryState(stored);
      return;
    }
    // First visit: pre-select the visitor's market. Only a positive BR match
    // switches away from the default; the result is persisted either way so
    // detection runs once per browser.
    const controller = new AbortController();
    fetch(GEOIP_ENDPOINT, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { country?: string } | null) => {
        if (lockedRef.current) return;
        const detected: Country = data?.country === 'BR' ? 'BR' : DEFAULT_COUNTRY;
        setCountryState(detected);
        try {
          window.localStorage.setItem(COUNTRY_STORAGE_KEY, detected);
        } catch {
          // Ignore storage failures — detection will simply run again next visit.
        }
      })
      .catch(() => {
        // Offline or blocked — keep the default.
      });
    return () => controller.abort();
  }, []);

  const value = useMemo(
    () => ({ country, setCountry, locked, setLocked }),
    [country, setCountry, locked],
  );

  return <CountryContext.Provider value={value}>{children}</CountryContext.Provider>;
}
