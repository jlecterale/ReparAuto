'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wrench,
  Clock,
  FileText,
  Coins,
  CaretLeft,
  CaretRight,
  X,
  Lightning,
} from '@phosphor-icons/react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import useSwipe from '@/hooks/useSwipe';
import { useApp } from '@/providers/AppProvider';
import { subscribeBanners } from '@/lib/db';
import type { Banner } from '@/types/banner';
import { formatarPreco, renderFoto } from '@/lib/utils';

const DISMISS_KEY = 'monetization_carousel_dismissed';

interface Slide {
  id: string;
  title: string;
  description: string;
  badge: string;
  badgeCor: 'accent' | 'green' | 'yellow' | 'blue' | 'brand' | 'gray';
  price?: string;
  ctaText: string;
  icon?: React.ReactNode;
  imageUrl?: string;
  gradient: string;
  link: string;
}

export default function MonetizationCarousel() {
  const router = useRouter();
  const { carros } = useApp();
  const allCars = carros?.carros || [];
  
  const [dbBanners, setDbBanners] = useState<Banner[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fallbackSlides: Slide[] = [
    {
      id: 'fb-1',
      title: 'Destaque a sua Oficina e Receba Mais Clientes',
      description: 'Adira ao plano "Oficina Verificada" para aparecer no topo das buscas geográficas na sua região, ganhar selo de confiança e chat ilimitado.',
      badge: 'B2B Profissionais',
      badgeCor: 'brand',
      price: 'Desde €15/mês',
      ctaText: 'Ver Planos Profissionais',
      icon: <Wrench size={48} className="text-white/20 absolute right-4 bottom-4 transform scale-150 rotate-12" />,
      gradient: 'from-brand-600 via-brand-700 to-brand-900',
      link: '/oficinas/registar',
    },
    {
      id: 'fb-2',
      title: 'Acesso Prioritário a Leads de Intenção de Compra',
      description: 'Seja o primeiro a enviar propostas! Stands e Lojas premium recebem notificações exclusivas com 24 horas de vantagem sobre a concorrência.',
      badge: 'Stands & Lojas',
      badgeCor: 'accent',
      price: '€50/mês',
      ctaText: 'Ativar Acesso Prioritário',
      icon: <Clock size={48} className="text-white/20 absolute right-4 bottom-4 transform scale-150 -rotate-12" />,
      gradient: 'from-amber-600 via-orange-700 to-orange-950',
      link: '/minhas-intencoes',
    },
    {
      id: 'fb-3',
      title: 'Venda o seu Carro 30% Mais Rápido',
      description: 'Adicione um Relatório de Histórico Verificado CarVertical ao seu anúncio. Reduza dúvidas dos compradores e destaque-se instantaneamente.',
      badge: 'Segurança & Confiança',
      badgeCor: 'green',
      price: '€5 por relatório',
      ctaText: 'Adicionar Relatório',
      icon: <FileText size={48} className="text-white/20 absolute right-4 bottom-4 transform scale-150" />,
      gradient: 'from-blue-600 via-blue-700 to-indigo-900',
      link: '/anunciar',
    },
    {
      id: 'fb-4',
      title: 'Crédito e Seguro Automóvel Integrados',
      description: 'Parcerias com as melhores instituições financeiras e seguradoras. Faça simulações gratuitas na página de qualquer veículo e consiga aprovação na hora.',
      badge: 'Serviços Financeiros',
      badgeCor: 'yellow',
      price: 'Simulação Grátis',
      ctaText: 'Simular Agora',
      icon: <Coins size={48} className="text-white/20 absolute right-4 bottom-4 transform scale-150 rotate-45" />,
      gradient: 'from-emerald-600 via-teal-700 to-emerald-900',
      link: '#',
    },
  ];

  // Subscribe to DB banners
  useEffect(() => {
    const unsub = subscribeBanners(
      (data) => {
        setDbBanners(data);
      },
      (err) => {
        console.error('[MonetizationCarousel] Erro ao carregar banners do DB:', err);
      }
    );
    return unsub;
  }, []);

  // Merge db active banners and premium cars
  const activeDbBanners = dbBanners.filter((b) => b.ativo);
  const promotionalSlides: Slide[] = activeDbBanners.length > 0
    ? activeDbBanners.map((b) => ({
        id: `banner-${b.id}`,
        title: b.title,
        description: b.description,
        badge: b.badge,
        badgeCor: b.badgeCor,
        price: b.price,
        ctaText: b.ctaText,
        gradient: b.gradient,
        link: b.link,
      }))
    : fallbackSlides;

  const premiumCars = allCars.filter((c) => c.status === 'aprovado' && c.impulso?.ativo === true);
  const mappedCarSlides: Slide[] = premiumCars.map((c) => {
    const firstPhoto = c.fotos && c.fotos.length > 0 ? c.fotos[0] : undefined;
    return {
      id: `carro-${c.id}`,
      title: `${c.marca} ${c.modelo} • ${formatarPreco(c.preco)}`,
      description: `Ano ${c.anoFabricacao} • ${c.km.toLocaleString('pt-PT')} km • ${c.combustivel} • ${c.local}. ${c.descricao}`,
      badge: 'Destaque Turbo',
      badgeCor: 'accent',
      price: formatarPreco(c.preco),
      ctaText: 'Ver Veículo',
      icon: <Lightning size={48} className="text-amber-500/20 absolute right-4 bottom-4 transform scale-150 rotate-12" />,
      imageUrl: firstPhoto,
      gradient: 'from-slate-900 via-slate-800 to-indigo-950',
      link: `/detalhes/${c.id}`,
    };
  });

  const slides = [...promotionalSlides, ...mappedCarSlides];

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem(DISMISS_KEY) === '1') {
      setVisible(false);
    }
  }, []);

  useEffect(() => {
    if (!isHovered && visible && slides.length > 1) {
      timerRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 6000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isHovered, visible, slides.length]);

  // Adjust currentSlide index if slides count changes and index is out of bounds
  useEffect(() => {
    if (currentSlide >= slides.length && slides.length > 0) {
      setCurrentSlide(0);
    }
  }, [slides.length, currentSlide]);

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  // Touch swipe: drag left → next slide, drag right → previous slide.
  const swipe = useSwipe({ onLeft: handleNext, onRight: handlePrev });

  const handleDotClick = (index: number) => {
    setCurrentSlide(index);
  };

  const handleCta = (link: string) => {
    if (link.startsWith('#')) {
      const el = document.getElementById('ofertas');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      router.push(link);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // ignore storage errors (private mode)
    }
  };

  if (!visible || slides.length === 0) return null;

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden shadow-lg mb-8 touch-pan-y"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...swipe}
      role="region"
      aria-label="Campanhas de Monetização Recar Garage"
    >
      {/* Slides Container */}
      <div
        className="flex transition-transform duration-500 ease-out h-[240px] sm:h-[200px]"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide) => {
          const hasImage = !!slide.imageUrl;
          let bgStyle: React.CSSProperties = {};
          if (hasImage) {
            const fotoData = renderFoto(slide.imageUrl!);
            if (fotoData.type === 'img') {
              bgStyle = {
                backgroundImage: `linear-gradient(to right, rgba(15, 23, 42, 0.95) 30%, rgba(15, 23, 42, 0.7) 65%, rgba(15, 23, 42, 0.4)), url(${fotoData.src})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              };
            }
          }

          return (
            <div
              key={slide.id}
              style={bgStyle}
              className={`w-full shrink-0 p-6 sm:p-8 flex flex-col justify-between text-white relative transition-all duration-300 ${
                !hasImage ? `bg-gradient-to-r ${slide.gradient}` : 'bg-slate-900'
              }`}
            >
              {slide.icon}

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Badge cor={slide.badgeCor} variante="solid">
                    {slide.badge}
                  </Badge>
                  {slide.price && (
                    <span className="text-xs bg-white/20 text-white font-bold px-2 py-0.5 rounded-full">
                      {slide.price}
                    </span>
                  )}
                </div>

                <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold leading-tight pr-12">
                  {slide.title}
                </h2>

                <p className="mt-2 text-white/85 text-xs sm:text-sm max-w-2xl line-clamp-2">
                  {slide.description}
                </p>
              </div>

              <div className="relative z-10 flex items-center gap-4 mt-3 sm:mt-0">
                <Button
                  tipo="premium"
                  tamanho="sm"
                  onClick={() => handleCta(slide.link)}
                >
                  {slide.ctaText}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dismiss Button */}
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/20 hover:bg-black/40 border border-white/20 flex items-center justify-center text-white transition-all z-30 focus:outline-none focus:ring-2 focus:ring-accent"
        aria-label="Dispensar campanhas"
      >
        <X size={14} weight="bold" />
      </button>

      {/* Navigation Buttons */}
      {slides.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/20 hover:bg-black/40 border border-white/20 items-center justify-center text-white transition-all z-20 focus:outline-none focus:ring-2 focus:ring-accent"
            aria-label="Slide anterior"
          >
            <CaretLeft size={20} weight="bold" />
          </button>

          <button
            onClick={handleNext}
            className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/20 hover:bg-black/40 border border-white/20 items-center justify-center text-white transition-all z-20 focus:outline-none focus:ring-2 focus:ring-accent"
            aria-label="Próximo slide"
          >
            <CaretRight size={20} weight="bold" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                currentSlide === index ? 'bg-white w-4' : 'bg-white/40 hover:bg-white/75'
              }`}
              aria-label={`Ir para slide ${index + 1}`}
              aria-current={currentSlide === index ? 'true' : 'false'}
            />
          ))}
        </div>
      )}
    </div>
  );
}

