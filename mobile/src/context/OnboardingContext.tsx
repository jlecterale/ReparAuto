import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

interface OnboardingContextValue {
  /** Whether the welcome tour modal is currently shown. */
  tourVisible: boolean;
  /** Show the tour (used on first launch and when backing out of signup). */
  openTour: () => void;
  /** Hide the tour. */
  closeTour: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

/**
 * Holds the welcome tour's visibility so screens outside the OnboardingGate
 * (e.g. the signup screen's "Voltar") can reopen it — backing out of signup
 * should return to the tour, not drop the visitor onto the listings.
 */
export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [tourVisible, setTourVisible] = useState(false);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      tourVisible,
      openTour: () => setTourVisible(true),
      closeTour: () => setTourVisible(false),
    }),
    [tourVisible],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding deve ser usado dentro de OnboardingProvider');
  return ctx;
}
