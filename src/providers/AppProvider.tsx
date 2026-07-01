'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import useAuth from '@/hooks/useAuth';
import useCarros from '@/hooks/useCarros';
import usePecas from '@/hooks/usePecas';
import useFavoritos from '@/hooks/useFavoritos';
import useOficinas from '@/hooks/useOficinas';
import { useChat } from '@/hooks/useChat';
import { useIntencoes } from '@/hooks/useIntencoes';
import LoginModal from '@/components/auth/LoginModal';
import type { AppContextValue, OpenLoginOptions } from '@/types/app';
import { subscribePremiumConfig } from '@/lib/db';
import type { PremiumConfig } from '@/types/usuario';
import { logEvent } from 'firebase/analytics';
import { getAnalyticsInstance } from '@/lib/firebase';
import { getPendingIntent, setPendingIntent, clearPendingIntent } from '@/lib/onboarding';

const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp deve ser usado dentro de AppProvider');
  }
  return ctx;
}

export default function AppProvider({ children }: { children: ReactNode }) {
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginRedirectTo, setLoginRedirectTo] = useState<string | undefined>();
  const [loginOptions, setLoginOptions] = useState<OpenLoginOptions | undefined>();

  const router = useRouter();
  const pathname = usePathname();

  const [premiumConfig, setPremiumConfig] = useState<PremiumConfig>({
    masterActive: true,
    impulsionamento: true,
    oficinas: true,
    leads: true,
  });

  useEffect(() => {
    const unsub = subscribePremiumConfig((config) => {
      setPremiumConfig(config);
    });
    return unsub;
  }, []);

  useEffect(() => {
    getAnalyticsInstance().then((analyticsInstance) => {
      if (analyticsInstance) {
        logEvent(analyticsInstance, 'page_view', {
          page_path: pathname,
          page_title: document.title,
        });
      }
    });
  }, [pathname]);

  const openLoginModal = useCallback((redirectTo?: string, options?: OpenLoginOptions) => {
    setLoginRedirectTo(redirectTo);
    setLoginOptions(options);
    // Tie the onboarding intent to this login attempt: persist it for a tour
    // open, and drop any stale one for a regular login so it can't hijack the
    // post-login navigation.
    if (options?.intent) setPendingIntent(options.intent);
    else clearPendingIntent();
    setLoginModalOpen(true);
  }, []);

  const auth = useAuth();
  // Only stream the heavy public collections on routes that render them.
  // Other routes still get the action methods (publicarCarro/publicarPeca);
  // add the route here if a new screen starts reading carros/pecas data.
  // /mercado, /avaliar-veiculo and /detalhes/[id] compute price analytics
  // against the carros collection, so they need the live stream too.
  const needsCarros =
    pathname === '/app' ||
    pathname.startsWith('/favoritos') ||
    pathname.startsWith('/mercado') ||
    pathname.startsWith('/avaliar-veiculo') ||
    pathname.startsWith('/detalhes');
  const needsPecas = pathname.startsWith('/pecas') || pathname.startsWith('/favoritos');
  const needsOficinas = pathname.startsWith('/oficinas') || pathname.startsWith('/favoritos');
  const carros = useCarros(needsCarros);
  const pecas = usePecas(needsPecas);
  const oficinas = useOficinas(needsOficinas);
  const requireLoginParaFavorito = useCallback(() => {
    openLoginModal(undefined, {
      modoInicial: 'registar',
      contexto: 'Crie a sua conta para guardar anúncios nos seus favoritos.',
    });
  }, [openLoginModal]);
  const favoritos = useFavoritos(auth.user, requireLoginParaFavorito);
  const chat = useChat(auth.user?.uid || null, auth.user?.nome || '');
  const intencoes = useIntencoes(auth.user?.uid || null);

  const { isLoggedIn, loading, profileCompleted } = auth;

  useEffect(() => {
    if (loading) return;
    if (isLoggedIn && !profileCompleted && pathname !== '/setup-perfil') {
      router.replace('/setup-perfil');
    }
  }, [isLoggedIn, loading, profileCompleted, router, pathname]);

  // Resume an onboarding intent once the account exists AND the profile is
  // complete. Covers both paths: a brand-new account (after the forced
  // /setup-perfil detour) and an existing account logging in from the welcome.
  // `sawAnonymous` ensures we only act on an auth transition that happened in
  // this session — a visitor who arrives already authenticated never picked a
  // card, so any stored intent is stale and is dropped instead of followed.
  const sawAnonymous = useRef(false);
  useEffect(() => {
    if (loading) return;
    if (!isLoggedIn) {
      sawAnonymous.current = true;
      return;
    }
    if (!sawAnonymous.current) {
      clearPendingIntent();
      return;
    }
    if (!profileCompleted) return;
    const target = getPendingIntent();
    if (!target) return;
    clearPendingIntent();
    router.replace(target);
  }, [isLoggedIn, loading, profileCompleted, router]);

  const closeLoginModal = useCallback(() => {
    setLoginModalOpen(false);
    setLoginRedirectTo(undefined);
    setLoginOptions(undefined);
  }, []);

  const handleLoginSuccess = useCallback(() => {
    setLoginModalOpen(false);
    if (loginRedirectTo) {
      router.push(loginRedirectTo);
      setLoginRedirectTo(undefined);
    }
  }, [loginRedirectTo, router]);

  const value: AppContextValue = useMemo(() => ({
    auth,
    carros,
    pecas,
    favoritos,
    oficinas,
    chat,
    intencoes,
    loginModal: {
      isOpen: loginModalOpen,
      openLoginModal,
      closeLoginModal,
    },
    premiumConfig,
  }), [auth, carros, pecas, favoritos, oficinas, chat, intencoes, loginModalOpen, openLoginModal, closeLoginModal, premiumConfig]);

  return (
    <AppContext.Provider value={value}>
      {children}
      <LoginModal
        show={loginModalOpen}
        onClose={closeLoginModal}
        onSuccess={handleLoginSuccess}
        modoInicial={loginOptions?.modoInicial}
        contexto={loginOptions?.contexto}
      />
    </AppContext.Provider>
  );
}
