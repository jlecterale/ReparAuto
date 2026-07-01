'use client';

import { useState, useEffect, useLayoutEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import MobileTopBar from '@/components/layout/MobileTopBar';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';
import ChatModal from '@/components/chat/ChatModal';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/components/ui/Toast';
import { WarningCircle } from '@phosphor-icons/react';
import NotificationPrePrompt from '@/components/ui/NotificationPrePrompt';
import CookieConsent from '@/components/ui/CookieConsent';
import OnboardingTour, { type OnboardingIntent } from '@/components/onboarding/OnboardingTour';
import RedirectingOverlay from '@/components/onboarding/RedirectingOverlay';
import BrandSplash from '@/components/onboarding/BrandSplash';
import { hasSeenOnboarding, markOnboardingSeen } from '@/lib/onboarding';

// useLayoutEffect runs before the browser paints (so we can cover the home
// before it's ever shown), but warns during SSR — fall back to useEffect there.
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default function LayoutShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdminRoute = pathname?.startsWith('/admin');
  const isLandingPage = pathname === '/';

  const [drawerOpen, setDrawerOpen] = useState(false);
  const { auth, loginModal } = useApp();
  const { user, isLoggedIn, refreshProfile, reenviarEmailVerificacao } = auth;
  const toast = useToast();

  // ---- Welcome onboarding (anonymous-first intent router) ----
  const [showTour, setShowTour] = useState(false);
  // Whether the welcome flow is settled (shown-and-closed, or never needed).
  // The cookie banner stays deferred until this is true, so the two first-visit
  // overlays are sequenced instead of stacking on top of each other.
  const [onboardingResolved, setOnboardingResolved] = useState(false);
  // While we're still deciding whether a first-time home visitor gets the tour
  // (i.e. waiting on auth), cover the screen so the listings never flash first.
  const [deciding, setDeciding] = useState(false);
  // Full-screen cover shown while navigating to the chosen intent's page, so
  // the home listings never flash through the async route transition.
  const [redirecting, setRedirecting] = useState<{ route: string; label: string } | null>(null);

  // Runs before the first paint: if this could be a first-time visitor landing
  // on the home route, drop the cover immediately so nothing shows until the
  // auth check below resolves into either the tour or the real page. Repeat
  // visitors and non-home routes skip the cover entirely.
  useIsomorphicLayoutEffect(() => {
    if (isAdminRoute || isLandingPage || pathname !== '/app') return;
    if (hasSeenOnboarding()) return;
    setDeciding(true);
  }, []);

  // Safety net: never keep the cover up for more than a moment if auth stalls.
  useEffect(() => {
    if (!deciding) return;
    const t = setTimeout(() => setDeciding(false), 3000);
    return () => clearTimeout(t);
  }, [deciding]);

  useEffect(() => {
    if (auth.loading) return;
    // Authenticated visitors never need the welcome; remember that so a later
    // logout in the same session doesn't pop the first-launch tour at them.
    if (isLoggedIn) {
      markOnboardingSeen();
      setOnboardingResolved(true);
      setDeciding(false);
      return;
    }
    // Only the home entry point shows the tour; everywhere else (and repeat
    // visitors) the onboarding is already resolved, so the cookie banner may show.
    if (isAdminRoute || isLandingPage || pathname !== '/app' || hasSeenOnboarding()) {
      setOnboardingResolved(true);
      setDeciding(false);
      return;
    }
    // Anonymous first-time visitor on /app: reveal the welcome now. The cover is
    // swapped straight for the tour (same gradient), so there's no listings flash.
    setShowTour(true);
    setDeciding(false);
  }, [auth.loading, isLoggedIn, isAdminRoute, isLandingPage, pathname]);

  const handleSelectIntent = (intent: OnboardingIntent) => {
    markOnboardingSeen();
    setOnboardingResolved(true);
    // Swap the tour straight for the redirect cover (same gradient → no flash),
    // then take the visitor to the page for the job they picked and open the
    // signup modal on top of it. The cover hides the async route transition so
    // the home listings — which can feel sparse while the marketplace is young —
    // never show through; the cover lifts once the destination page is active.
    setRedirecting({ route: intent.route, label: intent.label });
    setShowTour(false);
    router.push(intent.route);
    loginModal.openLoginModal(undefined, {
      modoInicial: 'registar',
      contexto: intent.contexto,
      intent: intent.route,
    });
  };

  // Lift the redirect cover once we've arrived at the destination route (give it
  // one beat to paint under the modal). The timeout is a safety net so a stalled
  // navigation can never trap the visitor behind the cover.
  useEffect(() => {
    if (!redirecting) return;
    const targetPath = redirecting.route.split('?')[0];
    if (pathname === targetPath) {
      const t = setTimeout(() => setRedirecting(null), 200);
      return () => clearTimeout(t);
    }
    const fallback = setTimeout(() => setRedirecting(null), 4000);
    return () => clearTimeout(fallback);
  }, [pathname, redirecting]);

  const handleDismissTour = () => {
    markOnboardingSeen();
    setShowTour(false);
    setOnboardingResolved(true);
  };

  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleResend = async () => {
    setResending(true);
    try {
      await reenviarEmailVerificacao();
      toast?.sucesso('E-mail de confirmação enviado! Verifique a sua caixa de entrada.');
    } catch (err: any) {
      toast?.erro('Erro ao enviar e-mail. Tente novamente mais tarde.');
    } finally {
      setResending(false);
    }
  };

  const handleCheck = async () => {
    setChecking(true);
    try {
      await refreshProfile();
      toast?.sucesso('Estado de verificação atualizado!');
    } catch (err: any) {
      toast?.erro('Erro ao verificar. Tente novamente.');
    } finally {
      setChecking(false);
    }
  };

  const [showNotifPrompt, setShowNotifPrompt] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !isLoggedIn || !user) return;
    if (!('Notification' in window)) return;

    if (Notification.permission === 'default') {
      const dismissedTime = localStorage.getItem('reparauto_notif_dismissed');
      if (dismissedTime) {
        const diff = Date.now() - parseInt(dismissedTime, 10);
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        if (diff < sevenDays) return;
      }
      setShowNotifPrompt(true);
    }
  }, [isLoggedIn, user]);

  const handleNotifDismiss = () => {
    localStorage.setItem('reparauto_notif_dismissed', Date.now().toString());
    setShowNotifPrompt(false);
  };

  const handleNotifToken = () => {
    toast?.sucesso('Notificações ativadas com sucesso!');
    setShowNotifPrompt(false);
  };

  if (isAdminRoute) {
    return <div className="min-h-screen bg-slate-950 flex flex-col">{children}</div>;
  }

  if (isLandingPage) {
    return (
      <>
        {children}
        <CookieConsent deferred={false} />
      </>
    );
  }

  return (
    <div className="min-h-screen">
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Content column — offset by the fixed sidebar on desktop */}
      <div className="flex flex-col min-h-screen lg:pl-64">
        <MobileTopBar onOpenMenu={() => setDrawerOpen(true)} />

        {isLoggedIn && user && user.emailVerified === false && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-sm text-amber-800">
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <WarningCircle size={20} className="text-amber-600 shrink-0" />
                <span>
                  Por favor, confirme o seu endereço de e-mail (<strong>{user.email}</strong>) para poder publicar anúncios, enviar mensagens e aceder a todas as funcionalidades.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-amber-100/50 border border-amber-300 rounded-lg transition disabled:opacity-50 cursor-pointer"
                >
                  {resending ? 'A enviar...' : 'Reenviar e-mail'}
                </button>
                <button
                  onClick={handleCheck}
                  disabled={checking}
                  className="px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition disabled:opacity-50 cursor-pointer"
                >
                  {checking ? 'A verificar...' : 'Já verifiquei'}
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-5 pb-24 lg:pb-5">{children}</main>
        <Footer />
      </div>

      <BottomNav />
      <ChatModal />
      <CookieConsent deferred={!onboardingResolved} />
      {showNotifPrompt && user && (
        <NotificationPrePrompt
          uid={user.uid}
          onDismiss={handleNotifDismiss}
          onToken={handleNotifToken}
        />
      )}
      {showTour && (
        <OnboardingTour onSelectIntent={handleSelectIntent} onDismiss={handleDismissTour} />
      )}
      {deciding && !showTour && <BrandSplash />}
      {redirecting && <RedirectingOverlay label={redirecting.label} />}
    </div>
  );
}
