'use client';

import { useApp } from '@/providers/AppProvider';

export default function usePremiumConfig() {
  const { premiumConfig } = useApp();
  const masterActive = premiumConfig?.masterActive !== false;
  const parceriasActive = masterActive && premiumConfig?.parceriasActive !== false;

  return {
    masterActive,
    impulsionamento: masterActive && !!premiumConfig?.impulsionamento,
    oficinas: masterActive && !!premiumConfig?.oficinas,
    leads: masterActive && !!premiumConfig?.leads,
    parceriasActive,
    financiamento: parceriasActive && premiumConfig?.financiamento !== false,
    seguro: parceriasActive && premiumConfig?.seguro !== false,
    atualizadoEm: premiumConfig?.atualizadoEm,
    atualizadoPor: premiumConfig?.atualizadoPor,
  };
}
