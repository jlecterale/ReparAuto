'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import {
  Car,
  Wrench,
  Storefront,
  MagnifyingGlass,
  X,
  ArrowRight,
  Sparkle,
} from '@phosphor-icons/react';
import Badge from '@/components/ui/Badge';

/**
 * The data a chosen intent carries back to the host: where to resume after the
 * visitor creates their account, and the line shown inside the signup modal.
 */
export interface OnboardingIntent {
  id: 'vender-carro' | 'vender-peca' | 'oficina' | 'comprar';
  route: string;
  contexto: string;
}

interface IntentCard extends OnboardingIntent {
  icon: ReactNode;
  titulo: string;
  descricao: string;
  /** Tailwind classes for the tinted icon chip. */
  iconWrap: string;
  /** Optional spotlight label — used to flag the differentiating path. */
  destaque?: string;
}

/**
 * Four doors, not a feature parade. Each card states the job the visitor came
 * to do and, in one line, the thing ReparAuto does differently from the generic
 * classifieds — so the welcome doubles as the showcase.
 */
const INTENTS: IntentCard[] = [
  {
    id: 'vender-carro',
    route: '/anunciar?tipo=carro',
    contexto: 'Crie a sua conta para anunciar o seu carro — é grátis e leva menos de um minuto.',
    icon: <Car size={26} weight="duotone" />,
    titulo: 'Vender o meu carro',
    descricao: 'Anúncio grátis e com selo de confiança — carros verificados vendem mais rápido.',
    iconWrap: 'bg-primary-50 text-primary-700',
  },
  {
    id: 'vender-peca',
    route: '/anunciar?tipo=peca',
    contexto: 'Crie a sua conta para anunciar as suas peças ou desmonte.',
    icon: <Wrench size={26} weight="duotone" />,
    titulo: 'Vender peças',
    descricao: 'Publique e quem procura essa peça é avisado na hora.',
    iconWrap: 'bg-secondary-50 text-secondary-700',
  },
  {
    id: 'oficina',
    route: '/oficinas/registar',
    contexto: 'Crie a sua conta para registar a sua oficina e receber clientes.',
    icon: <Storefront size={26} weight="duotone" />,
    titulo: 'Tenho uma oficina',
    descricao: 'Apareça para quem precisa de mecânico na sua zona.',
    iconWrap: 'bg-success-50 text-success-700',
  },
  {
    id: 'comprar',
    route: '/comprar',
    contexto: 'Crie a sua conta para criar o seu alerta de procura e receber ofertas.',
    icon: <MagnifyingGlass size={26} weight="duotone" />,
    titulo: 'Quero comprar',
    descricao: 'Diga o que procura e deixe os vendedores virem até si.',
    iconWrap: 'bg-warning-50 text-warning-700',
    destaque: 'Só na ReparAuto',
  },
];

interface OnboardingTourProps {
  onSelectIntent: (intent: OnboardingIntent) => void;
  onDismiss: () => void;
}

export default function OnboardingTour({ onSelectIntent, onDismiss }: OnboardingTourProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Lock the page behind the welcome and move focus into it (parity with Modal).
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Esc dismisses — the welcome must never feel like a trap.
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onDismiss();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onDismiss]);

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      className="fixed inset-0 z-[90] overflow-y-auto bg-gradient-to-br from-primary-700 via-primary-800 to-primary-950 outline-none"
    >
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Fechar"
        className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition"
      >
        <X size={18} weight="bold" />
      </button>

      <div className="min-h-full flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-3xl page-enter">
          {/* Header */}
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 text-fg-inverse text-xs font-bold px-3 py-1 mb-4">
              <Sparkle weight="fill" className="text-warning-300" /> Bem-vindo à ReparAuto
            </span>
            <h1
              id="onboarding-title"
              className="text-fg-inverse text-3xl sm:text-4xl font-extrabold"
            >
              O que o traz aqui hoje?
            </h1>
            <p className="text-white/80 mt-2.5 text-base sm:text-lg">
              Escolha um caminho e nós tratamos do resto. Sem rodeios.
            </p>
          </div>

          {/* Intent cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {INTENTS.map((intent, i) => (
              <button
                key={intent.id}
                type="button"
                onClick={() => onSelectIntent(intent)}
                style={{
                  animationName: 'fadeIn',
                  animationDuration: '0.4s',
                  animationTimingFunction: 'ease',
                  animationFillMode: 'both',
                  animationDelay: `${i * 80}ms`,
                }}
                className="group flex items-start gap-4 text-left bg-white rounded-2xl p-4 sm:p-5 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition"
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${intent.iconWrap}`}
                >
                  {intent.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-fg-heading font-extrabold text-base sm:text-lg">
                      {intent.titulo}
                    </h2>
                    {intent.destaque && (
                      <Badge cor="accent" variante="solid">
                        {intent.destaque}
                      </Badge>
                    )}
                  </div>
                  <p className="text-fg-muted text-sm mt-0.5">{intent.descricao}</p>
                </div>
                <ArrowRight
                  size={20}
                  className="text-fg-subtle group-hover:text-accent group-hover:translate-x-0.5 transition shrink-0 mt-1"
                />
              </button>
            ))}
          </div>

          {/* Escape hatch — low-commitment exit that still belongs to the funnel */}
          <div className="text-center mt-7">
            <button
              type="button"
              onClick={onDismiss}
              className="text-white/80 hover:text-fg-inverse text-sm font-semibold underline underline-offset-4 decoration-white/40 hover:decoration-white transition"
            >
              Só quero ver os anúncios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
