'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Car,
  Wrench,
  Engine,
  Storefront,
  ArrowRight,
  GooglePlayLogo,
  AppleLogo,
  MagnifyingGlass,
  CurrencyEur,
  Lightning,
  ShieldCheck,
  ChatCircle,
  CaretDown,
  ArrowDown,
  PaintBrush,
  DeviceMobile,
  Globe,
  Infinity as InfinityIcon,
  Timer,
  CheckCircle,
  Handshake,
  UserPlus,
  Target,
} from '@phosphor-icons/react';
import Footer from '@/components/layout/Footer';

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function AnimatedSection({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, visible } = useInView();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

const ECOSYSTEM_ITEMS = [
  {
    icon: Car,
    title: 'Compradores & Vendedores',
    description:
      'Compre ou venda carros novos e usados. Particulares ou stands, todos são bem-vindos.',
    color: 'bg-primary-50 text-primary-700 border-primary-200',
    iconColor: 'text-primary-600',
    cta: 'Comprar Carro',
    ctaSecondary: 'Vender Carro',
    href: '/comprar',
    hrefSecondary: '/anunciar?tipo=carro',
  },
  {
    icon: Engine,
    title: 'Peças & Desmonte',
    description:
      'Encontre peças para o seu carro ou venda peças que já não precisa. Preços acessíveis.',
    color: 'bg-secondary-50 text-secondary-700 border-secondary-200',
    iconColor: 'text-secondary-600',
    cta: 'Procurar Peças',
    ctaSecondary: 'Vender Peças',
    href: '/pecas',
    hrefSecondary: '/anunciar?tipo=peca',
  },
  {
    icon: Wrench,
    title: 'Mecânicos & Oficinas',
    description:
      'Mecânicos independentes e oficinas divulgam os seus serviços e encontram clientes.',
    color: 'bg-success-50 text-success-700 border-success-200',
    iconColor: 'text-success-600',
    cta: 'Ver Oficinas',
    ctaSecondary: 'Registar Oficina',
    href: '/oficinas',
    hrefSecondary: '/oficinas/registar',
  },
  {
    icon: PaintBrush,
    title: 'Serviços Especializados',
    description:
      'Pintura, bate-chapa, eletricista auto, diagnóstico — todos os serviços automóveis.',
    color: 'bg-warning-50 text-warning-700 border-warning-200',
    iconColor: 'text-warning-600',
    cta: 'Ver Serviços',
    href: '/oficinas',
  },
];

const FEATURES = [
  {
    icon: CurrencyEur,
    title: 'Gratuito para Particulares',
    description: 'Particulares publicam quantos anúncios quiserem, sem pagar nada — para sempre.',
  },
  {
    icon: InfinityIcon,
    title: 'Sem Limites de Anúncios',
    description: 'Sem pacotes nem restrições. Publique à vontade, sem contar anúncios.',
  },
  {
    icon: Lightning,
    title: 'Simples e Rápido',
    description: 'Publique em menos de 2 minutos. Interface intuitiva pensada para si.',
  },
  {
    icon: ShieldCheck,
    title: 'Seguro e Fiável',
    description: 'Perfis verificados, avaliações reais e sistema de denúncias para a sua proteção.',
  },
  {
    icon: ChatCircle,
    title: 'Chat Integrado',
    description: 'Comunique diretamente com vendedores, mecânicos e compradores sem sair da plataforma.',
  },
  {
    icon: DeviceMobile,
    title: 'App Nativa',
    description: 'Disponível para Android e brevemente para iOS. Leve o RecarGarage no bolso.',
  },
];

const SCENARIOS = [
  {
    emoji: '🔧',
    title: 'O carro precisa de arranjo antes de vender?',
    description:
      'Encontre a peça que falta, o mecânico para montar e publique o anúncio. Tudo na mesma plataforma.',
    cta: 'Vender carro',
    href: '/anunciar?tipo=carro',
  },
  {
    emoji: '🏪',
    title: 'Tem um stand ou oficina?',
    description:
      'Registe-se gratuitamente por tempo limitado. Divulgue os seus serviços e atraia novos clientes.',
    cta: 'Registar oficina',
    href: '/oficinas/registar',
  },
  {
    emoji: '🔍',
    title: 'Procura um mecânico de confiança?',
    description:
      'Veja avaliações, compare preços e contacte oficinas e mecânicos independentes na sua zona.',
    cta: 'Ver oficinas',
    href: '/oficinas',
  },
  {
    emoji: '🚗',
    title: 'Quer comprar um carro usado?',
    description:
      'Pesquise por marca, modelo, preço e localização. Encontre o carro ideal sem complicações.',
    cta: 'Comprar carro',
    href: '/comprar',
  },
];

const FAQ_ITEMS = [
  {
    q: 'O RecarGarage é mesmo gratuito?',
    a: 'Para particulares, sim — totalmente gratuito e sem limites de anúncios, para sempre. Para profissionais (stands e oficinas), o acesso é gratuito por tempo limitado. Aproveite para se posicionar agora.',
  },
  {
    q: 'Quem pode usar a plataforma?',
    a: 'Qualquer pessoa em Portugal. Particulares, stands, oficinas, mecânicos independentes e vendedores de peças.',
  },
  {
    q: 'Qual a diferença para os concorrentes?',
    a: 'Os concorrentes focam-se apenas na compra e venda. No RecarGarage, criámos um ecossistema completo: compre, venda, encontre peças, mecânicos e oficinas — tudo ligado num só lugar.',
  },
  {
    q: 'Tenho uma oficina. É gratuito para profissionais?',
    a: 'Sim! Por tempo limitado, o registo e a utilização são totalmente gratuitos para stands e oficinas. Aproveite para se posicionar agora.',
  },
  {
    q: 'A app está disponível para telemóvel?',
    a: 'Sim! A app Android já está disponível na Google Play Store. A versão iOS está em processo de aprovação pela Apple e será lançada em breve.',
  },
  {
    q: 'Como funciona o sistema de avaliações?',
    a: 'Após uma interação, pode avaliar vendedores, compradores e prestadores de serviço. As avaliações são públicas e ajudam toda a comunidade.',
  },
];

function FAQItem({ item }: { item: (typeof FAQ_ITEMS)[number] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-neutral-200 rounded-2xl overflow-hidden transition-shadow hover:shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left cursor-pointer bg-white hover:bg-neutral-50 transition-colors"
        aria-expanded={open}
      >
        <span className="text-fg-heading font-bold text-base">{item.q}</span>
        <CaretDown
          size={20}
          weight="bold"
          className={`shrink-0 text-fg-muted transition-transform duration-300 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`grid transition-all duration-300 ease-out ${
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <p className="px-6 pb-5 text-fg-muted leading-relaxed">{item.a}</p>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [headerSolid, setHeaderSolid] = useState(false);

  useEffect(() => {
    const handler = () => setHeaderSolid(window.scrollY > 40);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* ─── HEADER ─── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          headerSolid
            ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-neutral-100'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt="RecarGarage"
              width={140}
              height={48}
              priority
              className={`h-8 sm:h-9 w-auto transition-all duration-300 ${
                headerSolid ? 'brightness-0' : 'brightness-0 invert'
              }`}
            />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#ecossistema"
              className={`text-sm font-semibold transition-colors ${
                headerSolid ? 'text-fg-muted hover:text-fg-heading' : 'text-white/80 hover:text-white'
              }`}
            >
              Ecossistema
            </a>
            <a
              href="#funcionalidades"
              className={`text-sm font-semibold transition-colors ${
                headerSolid ? 'text-fg-muted hover:text-fg-heading' : 'text-white/80 hover:text-white'
              }`}
            >
              Funcionalidades
            </a>
            <a
              href="#faq"
              className={`text-sm font-semibold transition-colors ${
                headerSolid ? 'text-fg-muted hover:text-fg-heading' : 'text-white/80 hover:text-white'
              }`}
            >
              FAQ
            </a>
            <a
              href="#descarregar"
              className={`text-sm font-semibold transition-colors ${
                headerSolid ? 'text-fg-muted hover:text-fg-heading' : 'text-white/80 hover:text-white'
              }`}
            >
              Descarregar
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/app"
              className={`hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                headerSolid
                  ? 'bg-accent hover:bg-accent-hover text-white shadow-sm'
                  : 'bg-white text-primary-900 hover:bg-white/90 shadow-sm'
              }`}
            >
              Entrar
              <ArrowRight size={16} weight="bold" />
            </Link>
            <Link
              href="/app"
              className={`sm:hidden inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                headerSolid
                  ? 'bg-accent hover:bg-accent-hover text-white'
                  : 'bg-white text-primary-900 hover:bg-white/90'
              }`}
            >
              Entrar
            </Link>
          </div>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 pt-28 sm:pt-36 pb-20 sm:pb-28">
        {/* Decorative shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-accent/8 blur-3xl" />
          <div className="absolute -bottom-20 -left-40 w-[400px] h-[400px] rounded-full bg-primary-400/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary-700/20 blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-white/90 text-sm font-semibold mb-6 animate-fade-in"
              style={{ animationDelay: '0ms' }}
            >
              <span className="w-2 h-2 rounded-full bg-success-400 animate-pulse" />
              Novo em Portugal
            </div>

            {/* Headline */}
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl text-white leading-[1.1] mb-6 animate-fade-in"
              style={{ animationDelay: '100ms' }}
            >
              Mais do que comprar e vender.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-300 via-secondary-400 to-secondary-500">
                O ecossistema automóvel completo.
              </span>
            </h1>

            {/* Subheadline */}
            <p
              className="text-lg sm:text-xl text-white/75 leading-relaxed mb-10 max-w-2xl animate-fade-in"
              style={{ animationDelay: '200ms' }}
            >
              Carros, peças, mecânicos e oficinas — tudo ligado num só lugar.
              Simples, rápido e gratuito para particulares.
            </p>

            {/* CTAs */}
            <div
              className="flex flex-col sm:flex-row items-start gap-4 mb-6 animate-fade-in"
              style={{ animationDelay: '300ms' }}
            >
              <Link
                href="/app"
                className="inline-flex items-center gap-2.5 px-7 py-4 rounded-2xl bg-accent hover:bg-accent-hover text-white text-base font-bold shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/30 transition-all hover:-translate-y-0.5"
              >
                <Globe size={22} weight="bold" />
                Explorar Plataforma
              </Link>
              <a
                href="https://play.google.com/store/apps/details?id=com.recargarage"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-7 py-4 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-base font-bold border border-white/20 transition-all hover:-translate-y-0.5"
              >
                <GooglePlayLogo size={22} weight="fill" />
                Google Play
              </a>
              <div
                className="inline-flex items-center gap-2.5 px-7 py-4 rounded-2xl bg-white/5 text-white/50 text-base font-bold border border-white/10 cursor-default"
                aria-disabled="true"
                aria-label="App Store — em breve"
              >
                <AppleLogo size={22} weight="fill" />
                App Store
                <span className="text-[10px] text-white/40 font-semibold bg-white/10 rounded-full px-2 py-0.5">Em breve</span>
              </div>
            </div>

            {/* Register CTA */}
            <div
              className="mb-12 animate-fade-in"
              style={{ animationDelay: '350ms' }}
            >
              <Link
                href="/anunciar"
                className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-semibold underline underline-offset-4 decoration-white/30 hover:decoration-white/60 transition-colors"
              >
                Criar conta e publicar anúncio grátis
                <ArrowRight size={14} weight="bold" />
              </Link>
            </div>

            {/* Social proof */}
            <div
              className="flex flex-wrap items-center gap-6 text-white/60 text-sm animate-fade-in"
              style={{ animationDelay: '400ms' }}
            >
              <div className="flex items-center gap-2">
                <CheckCircle size={18} weight="fill" className="text-success-400" />
                <span>Gratuito para particulares</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={18} weight="fill" className="text-success-400" />
                <span>Sem limites de anúncios</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={18} weight="fill" className="text-success-400" />
                <span>Gratuito para profissionais por tempo limitado</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce">
          <ArrowDown size={24} className="text-white/30" />
        </div>
      </section>

      {/* ─── ECOSYSTEM ─── */}
      <section id="ecossistema" className="py-20 sm:py-28 bg-neutral-50 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <AnimatedSection className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary-50 text-primary-700 text-sm font-bold mb-4 border border-primary-100">
              Ecossistema
            </span>
            <h2 className="text-3xl sm:text-4xl text-fg-heading mb-4">
              Tudo o que o automóvel precisa,{' '}
              <span className="text-accent">num só lugar</span>
            </h2>
            <p className="text-fg-muted text-lg max-w-2xl mx-auto">
              Enquanto os concorrentes se limitam à compra e venda, nós ligamos todo o
              ecossistema automóvel. Compradores, vendedores, mecânicos e muito mais.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-16">
            {ECOSYSTEM_ITEMS.map((item, i) => (
              <AnimatedSection key={item.title} delay={i * 100}>
                <div
                  className="relative p-6 sm:p-8 rounded-2xl border bg-white hover:shadow-lg transition-all duration-300 group flex flex-col h-full"
                >
                  <div
                    className={`w-14 h-14 rounded-xl ${item.color} flex items-center justify-center mb-5 border group-hover:scale-110 transition-transform`}
                  >
                    <item.icon size={28} weight="duotone" className={item.iconColor} />
                  </div>
                  <h3 className="text-lg text-fg-heading mb-2">{item.title}</h3>
                  <p className="text-fg-muted leading-relaxed mb-5">{item.description}</p>
                  <div className="mt-auto flex flex-wrap gap-2">
                    <Link
                      href={item.href}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-50 hover:bg-primary-100 text-primary-700 text-sm font-bold border border-primary-100 transition-colors"
                    >
                      {item.cta}
                      <ArrowRight size={14} weight="bold" />
                    </Link>
                    {item.ctaSecondary && item.hrefSecondary && (
                      <Link
                        href={item.hrefSecondary}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-fg-muted hover:text-fg-heading text-sm font-semibold hover:bg-neutral-100 transition-colors"
                      >
                        {item.ctaSecondary}
                        <ArrowRight size={14} weight="bold" />
                      </Link>
                    )}
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>

          {/* Connection visualization */}
          <AnimatedSection>
            <div className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 rounded-3xl p-8 sm:p-12 overflow-hidden">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-accent/10 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-primary-400/10 blur-3xl" />
              </div>
              <div className="relative text-left">
                <Handshake size={48} weight="duotone" className="text-accent mb-6" />
                <h3 className="text-2xl sm:text-3xl text-white mb-4">
                  Um ecossistema que se conecta
                </h3>
                <p className="text-white/70 text-lg max-w-2xl mb-10 leading-relaxed">
                  O João quer vender o carro mas falta-lhe um farol. Encontra a peça no
                  RecarGarage, o mecânico para montar e publica o anúncio — tudo sem sair
                  da plataforma.
                </p>
                <div className="flex flex-wrap justify-start gap-4">
                  {[
                    { icon: MagnifyingGlass, label: 'Procura a peça' },
                    { icon: Wrench, label: 'Encontra o mecânico' },
                    { icon: Car, label: 'Vende o carro' },
                  ].map((step, i) => (
                    <div key={step.label} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/15">
                        <step.icon size={24} weight="bold" className="text-white" />
                      </div>
                      <span className="text-white/90 font-semibold text-sm">{step.label}</span>
                      {i < 2 && (
                        <ArrowRight size={18} weight="bold" className="text-accent ml-1 hidden sm:block" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── USE CASES / SCENARIOS ─── */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <AnimatedSection className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-secondary-50 text-secondary-700 text-sm font-bold mb-4 border border-secondary-100">
              Para Si
            </span>
            <h2 className="text-3xl sm:text-4xl text-fg-heading mb-4">
              O RecarGarage adapta-se a si
            </h2>
            <p className="text-fg-muted text-lg max-w-2xl mx-auto">
              Seja comprador, vendedor, mecânico ou dono de stand — há sempre uma forma de beneficiar.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SCENARIOS.map((item, i) => (
              <AnimatedSection key={item.title} delay={i * 80}>
                <div className="flex gap-5 p-6 sm:p-8 rounded-2xl bg-neutral-50 border border-neutral-200 hover:border-neutral-300 hover:shadow-sm transition-all h-full">
                  <span className="text-3xl shrink-0 mt-1">{item.emoji}</span>
                  <div className="flex flex-col">
                    <h3 className="text-base text-fg-heading mb-2">{item.title}</h3>
                    <p className="text-fg-muted text-sm leading-relaxed mb-4">{item.description}</p>
                    <Link
                      href={item.href}
                      className="mt-auto inline-flex items-center gap-1.5 text-accent hover:text-accent-hover text-sm font-bold transition-colors"
                    >
                      {item.cta}
                      <ArrowRight size={14} weight="bold" />
                    </Link>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="funcionalidades" className="py-20 sm:py-28 bg-neutral-50 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <AnimatedSection className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-success-50 text-success-700 text-sm font-bold mb-4 border border-success-100">
              Funcionalidades
            </span>
            <h2 className="text-3xl sm:text-4xl text-fg-heading mb-4">
              Pensado para ser{' '}
              <span className="text-accent">simples</span>
            </h2>
            <p className="text-fg-muted text-lg max-w-2xl mx-auto">
              Sem complicações, sem custos escondidos. Tudo o que precisa para
              comprar, vender ou encontrar serviços automóveis.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <AnimatedSection key={feature.title} delay={i * 80}>
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-neutral-200 hover:shadow-lg hover:border-neutral-300 transition-all duration-300 h-full group">
                  <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mb-5 border border-primary-100 group-hover:bg-primary-100 transition-colors">
                    <feature.icon size={24} weight="duotone" className="text-primary-600" />
                  </div>
                  <h3 className="text-base text-fg-heading mb-2">{feature.title}</h3>
                  <p className="text-fg-muted text-sm leading-relaxed">{feature.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PROMO BANNER — free for pros ─── */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <AnimatedSection>
            <div className="relative bg-gradient-to-r from-secondary-800 via-secondary-700 to-accent rounded-3xl p-8 sm:p-14 overflow-hidden">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-white/10 blur-3xl" />
              </div>
              <div className="relative flex flex-col lg:flex-row items-center gap-8 lg:gap-14">
                <div className="flex-1 text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-bold mb-5">
                    <Timer size={14} weight="bold" />
                    Oferta por tempo limitado
                  </div>
                  <h2 className="text-2xl sm:text-3xl text-white mb-3">
                    Gratuito para Stands e Oficinas
                  </h2>
                  <p className="text-white text-lg leading-relaxed max-w-xl">
                    Registe o seu stand ou oficina agora e aproveite o acesso completo sem qualquer custo.
                    Posicione-se antes de toda a gente.
                  </p>
                </div>
                <div className="flex flex-col gap-3 shrink-0">
                  <Link
                    href="/anunciar?tipo=carro"
                    className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-white text-primary-900 text-base font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                  >
                    <Storefront size={22} weight="bold" />
                    Publicar Anúncio
                  </Link>
                  <Link
                    href="/oficinas/registar"
                    className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-white/15 backdrop-blur-sm text-white text-base font-bold border border-white/30 hover:bg-white/25 transition-all hover:-translate-y-0.5"
                  >
                    <Wrench size={22} weight="bold" />
                    Registar Oficina
                  </Link>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="py-20 sm:py-28 bg-neutral-50 scroll-mt-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <AnimatedSection className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 rounded-full bg-neutral-100 text-fg-muted text-sm font-bold mb-4 border border-neutral-200">
              FAQ
            </span>
            <h2 className="text-3xl sm:text-4xl text-fg-heading mb-4">
              Perguntas Frequentes
            </h2>
          </AnimatedSection>

          <AnimatedSection>
            <div className="flex flex-col gap-3">
              {FAQ_ITEMS.map((item, i) => (
                <FAQItem key={i} item={item} />
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── REGISTER CTA ─── */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <AnimatedSection className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-bold mb-4 border border-accent/20">
              Comece Agora
            </span>
            <h2 className="text-3xl sm:text-4xl text-fg-heading mb-4">
              O que pretende fazer?
            </h2>
            <p className="text-fg-muted text-lg max-w-2xl mx-auto">
              Escolha a ação e comece já. Sem complicações — registe-se apenas quando publicar.
            </p>
          </AnimatedSection>

          <AnimatedSection>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <Link
                href="/anunciar?tipo=carro"
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-neutral-200 bg-white hover:border-accent hover:shadow-lg transition-all group text-center"
              >
                <div className="w-14 h-14 rounded-xl bg-primary-50 flex items-center justify-center border border-primary-100 group-hover:bg-primary-100 transition-colors">
                  <Car size={28} weight="duotone" className="text-primary-600" />
                </div>
                <span className="text-fg-heading font-bold text-sm">Vender Carro</span>
                <span className="text-fg-muted text-xs">Publicar anúncio grátis</span>
              </Link>

              <Link
                href="/anunciar?tipo=peca"
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-neutral-200 bg-white hover:border-accent hover:shadow-lg transition-all group text-center"
              >
                <div className="w-14 h-14 rounded-xl bg-secondary-50 flex items-center justify-center border border-secondary-100 group-hover:bg-secondary-100 transition-colors">
                  <Engine size={28} weight="duotone" className="text-secondary-600" />
                </div>
                <span className="text-fg-heading font-bold text-sm">Vender Peças</span>
                <span className="text-fg-muted text-xs">Anuncie peças e desmonte</span>
              </Link>

              <Link
                href="/oficinas/registar"
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-neutral-200 bg-white hover:border-accent hover:shadow-lg transition-all group text-center"
              >
                <div className="w-14 h-14 rounded-xl bg-success-50 flex items-center justify-center border border-success-100 group-hover:bg-success-100 transition-colors">
                  <Wrench size={28} weight="duotone" className="text-success-600" />
                </div>
                <span className="text-fg-heading font-bold text-sm">Registar Oficina</span>
                <span className="text-fg-muted text-xs">Gratuito por tempo limitado</span>
              </Link>

              <Link
                href="/comprar"
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-neutral-200 bg-white hover:border-accent hover:shadow-lg transition-all group text-center"
              >
                <div className="w-14 h-14 rounded-xl bg-warning-50 flex items-center justify-center border border-warning-100 group-hover:bg-warning-100 transition-colors">
                  <Target size={28} weight="duotone" className="text-warning-600" />
                </div>
                <span className="text-fg-heading font-bold text-sm">Criar Procura</span>
                <span className="text-fg-muted text-xs">Diga o que procura</span>
              </Link>
            </div>
          </AnimatedSection>

          <AnimatedSection className="text-center mt-8">
            <Link
              href="/app"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-accent hover:bg-accent-hover text-white text-base font-bold shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/30 transition-all hover:-translate-y-0.5"
            >
              <UserPlus size={22} weight="bold" />
              Criar Conta Gratuita
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── DOWNLOAD / FINAL CTA ─── */}
      <section id="descarregar" className="py-20 sm:py-28 bg-white scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <AnimatedSection>
            <div className="text-center">
              <h2 className="text-3xl sm:text-4xl text-fg-heading mb-4">
                Comece já a usar o RecarGarage
              </h2>
              <p className="text-fg-muted text-lg max-w-2xl mx-auto mb-10">
                Disponível na web e no telemóvel. Escolha a sua forma preferida de aceder ao
                ecossistema automóvel mais completo de Portugal.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                {/* Web App */}
                <Link
                  href="/app"
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary-900 hover:bg-primary-800 text-white font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                >
                  <Globe size={24} weight="bold" />
                  <div className="text-left">
                    <span className="block text-xs text-white/70 font-semibold">Abrir na</span>
                    <span className="block text-base">Web App</span>
                  </div>
                </Link>

                {/* Google Play */}
                <a
                  href="https://play.google.com/store/apps/details?id=com.recargarage"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                >
                  <GooglePlayLogo size={24} weight="fill" />
                  <div className="text-left">
                    <span className="block text-xs text-white/70 font-semibold">Disponível na</span>
                    <span className="block text-base">Google Play</span>
                  </div>
                </a>

                {/* iOS Coming Soon */}
                <div className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-neutral-100 text-fg-muted font-bold border border-neutral-200 cursor-default">
                  <AppleLogo size={24} weight="fill" />
                  <div className="text-left">
                    <span className="block text-xs text-fg-subtle font-semibold">Em breve na</span>
                    <span className="block text-base">App Store</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-fg-subtle">
                A app para iOS está em processo de aprovação pela Apple.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <Footer />
    </div>
  );
}
