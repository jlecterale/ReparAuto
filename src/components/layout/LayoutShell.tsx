'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
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
import { hasSeenOnboarding, markOnboardingSeen } from '@/lib/onboarding';

export default function LayoutShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const { auth, loginModal } = useApp();
  const { user, isLoggedIn, refreshProfile, reenviarEmailVerificacao } = auth;
  const toast = useToast();

  // ---- Welcome onboarding (anonymous-first intent router) ----
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    if (auth.loading) return;
    // Authenticated visitors never need the welcome; remember that so a later
    // logout in the same session doesn't pop the first-launch tour at them.
    if (isLoggedIn) {
      markOnboardingSeen();
      return;
    }
    if (isAdminRoute || pathname !== '/') return; // home entry point only
    if (hasSeenOnboarding()) return; // once per visitor
    // Let the home paint first, then welcome them — graceful, not a gate.
    const t = setTimeout(() => setShowTour(true), 600);
    return () => clearTimeout(t);
  }, [auth.loading, isLoggedIn, isAdminRoute, pathname]);

  const handleSelectIntent = (intent: OnboardingIntent) => {
    markOnboardingSeen();
    setShowTour(false);
    loginModal.openLoginModal(undefined, {
      modoInicial: 'registar',
      contexto: intent.contexto,
      intent: intent.route,
    });
  };

  const handleDismissTour = () => {
    markOnboardingSeen();
    setShowTour(false);
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
      <CookieConsent />
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
    </div>
  );
}
