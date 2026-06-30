'use client';

import { useEffect } from 'react';
import { CircleNotch } from '@phosphor-icons/react';

/**
 * Full-screen cover shown while the welcome routes the visitor to the page for
 * their chosen intent. It sits above the login modal (z-[120] > Modal's z-[100])
 * so the home listings never flash through during the async navigation — the
 * visitor sees a calm "redirecting" beat, then the action page with signup on top.
 */
export default function RedirectingOverlay({ label }: { label?: string }) {
  // Match the tour's scroll lock so the swap from tour → cover is seamless.
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[120] flex flex-col items-center justify-center gap-5 px-6 text-center bg-gradient-to-br from-primary-700 via-primary-800 to-primary-950 page-enter"
    >
      <CircleNotch size={44} weight="bold" className="animate-spin text-white" />
      <div>
        <p className="text-fg-inverse text-lg sm:text-xl font-extrabold">A redirecionar…</p>
        {label && <p className="text-white/80 text-sm sm:text-base mt-1">{label}</p>}
      </div>
    </div>
  );
}
