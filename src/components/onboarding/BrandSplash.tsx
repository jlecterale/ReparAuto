'use client';

import { useEffect } from 'react';
import { CircleNotch } from '@phosphor-icons/react';

/**
 * Brief full-screen cover (brand gradient + spinner) shown while we decide,
 * before the first paint, whether a first-time visitor on the home route should
 * see the welcome tour. It uses the same gradient as the tour, so when the tour
 * is ready the swap is seamless — and the home listings never flash underneath.
 */
export default function BrandSplash() {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div
      role="status"
      aria-label="A carregar"
      className="fixed inset-0 z-[120] flex items-center justify-center bg-gradient-to-br from-primary-700 via-primary-800 to-primary-950"
    >
      <CircleNotch size={44} weight="bold" className="animate-spin text-white" />
    </div>
  );
}
