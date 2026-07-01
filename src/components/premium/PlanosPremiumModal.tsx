'use client';

import { useState } from 'react';
import {
  Crown,
  Rocket,
  Star,
  Lightning,
  CheckCircle,
  Wrench,
  Storefront,
  CaretRight,
  CalendarBlank,
  Clock,
} from '@phosphor-icons/react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import usePremiumConfig from '@/hooks/usePremiumConfig';

interface PlanosPremiumModalProps {
  show: boolean;
  onClose: () => void;
}

interface Plano {
  id: string;
  nome: string;
  descricao: string;
  preco: string;
  periodo: string;
  /** Preço mensal em euros (para cálculo de desconto anual) */
  precoMensal?: number;
  /** Preço anual em euros */
  precoAnual?: number;
  destaque: boolean;
  /** Badge exibido quando está no modo mensal */
  badge?: string;
  /** Badge exibido quando está no modo anual (pode diferir) */
  badgeAnual?: string;
  icon: React.ReactNode;
  beneficios: string[];
  /** Stripe Price ID — preencher após configuração do Stripe */
  stripePriceId: string;
  stripePriceIdAnual?: string;
}

/* ────────────────────────────────────────────────────────────
 * TODO: Substituir os stripePriceId abaixo pelos IDs reais
 * criados no dashboard do Stripe (ex: price_1XXXXXXXXXXXXXX).
 * Depois, descomentar a chamada a /api/stripe/checkout-session
 * dentro de handleEscolherPlano().
 * ──────────────────────────────────────────────────────────── */

const PLANOS_ANUNCIOS: Plano[] = [
  {
    id: 'impulso-7d',
    nome: 'Impulso 7 dias',
    descricao: 'O seu anúncio aparece em destaque durante 7 dias.',
    preco: '€2,99',
    periodo: '7 dias',
    destaque: false,
    icon: <Rocket size={28} weight="duotone" className="text-secondary-500" />,
    beneficios: [
      'Destaque no topo da lista',
      'Badge "Em Destaque" no anúncio',
      'Mais visualizações garantidas',
    ],
    stripePriceId: 'price_IMPULSO_7D_PLACEHOLDER',
  },
  {
    id: 'impulso-30d',
    nome: 'Impulso 30 dias',
    descricao: 'Destaque contínuo durante 1 mês inteiro.',
    preco: '€7,99',
    periodo: '30 dias',
    destaque: true,
    badge: 'Mais Popular',
    icon: <Star size={28} weight="duotone" className="text-warning-400" />,
    beneficios: [
      'Destaque no topo da lista',
      'Badge "Em Destaque" no anúncio',
      'Prioridade nas pesquisas',
      'Estatísticas de visualização',
    ],
    stripePriceId: 'price_IMPULSO_30D_PLACEHOLDER',
  },
  {
    id: 'turbo',
    nome: 'Turbo',
    descricao: 'Máxima exposição com banner na página principal.',
    preco: '€14,99',
    periodo: '30 dias',
    destaque: false,
    icon: <Lightning size={28} weight="duotone" className="text-danger-500" />,
    beneficios: [
      'Tudo do Impulso 30 dias',
      'Banner rotativo na homepage',
      'Destaque nas redes sociais',
      'Selo "Turbo" exclusivo',
      'Suporte prioritário',
    ],
    stripePriceId: 'price_TURBO_PLACEHOLDER',
  },
];

const PLANOS_OFICINAS: Plano[] = [
  {
    id: 'oficina-basico',
    nome: 'Oficina Verificada',
    descricao: 'Selo de confiança e presença na listagem de oficinas.',
    preco: '€15',
    periodo: '/mês',
    precoMensal: 15,
    precoAnual: 150,
    destaque: false,
    icon: <Wrench size={28} weight="duotone" className="text-primary-500" />,
    beneficios: [
      'Selo "Verificada" no perfil',
      'Listagem na secção Oficinas',
      'Chat com clientes (5/mês)',
      'Perfil personalizado',
    ],
    stripePriceId: 'price_OFICINA_BASICO_PLACEHOLDER',
    stripePriceIdAnual: 'price_OFICINA_BASICO_ANUAL_PLACEHOLDER',
  },
  {
    id: 'oficina-pro',
    nome: 'Oficina Pro',
    descricao: 'Topo das buscas geográficas e chat ilimitado.',
    preco: '€35',
    periodo: '/mês',
    precoMensal: 35,
    precoAnual: 300,
    destaque: true,
    badge: 'Recomendado',
    badgeAnual: 'Melhor Oferta 🔥',
    icon: <Crown size={28} weight="duotone" className="text-warning-400" />,
    beneficios: [
      'Tudo do plano Verificada',
      'Topo das buscas na região',
      'Chat ilimitado com clientes',
      'Destaque no mapa',
      'Badge Premium dourado',
    ],
    stripePriceId: 'price_OFICINA_PRO_PLACEHOLDER',
    stripePriceIdAnual: 'price_OFICINA_PRO_ANUAL_PLACEHOLDER',
  },
];

const PLANOS_LEADS: Plano[] = [
  {
    id: 'leads-pro',
    nome: 'Leads Prioritários',
    descricao: 'Acesso antecipado a intenções de compra.',
    preco: '€50',
    periodo: '/mês',
    precoMensal: 50,
    precoAnual: 500,
    destaque: true,
    badge: 'Stands & Lojas',
    icon: <Storefront size={28} weight="duotone" className="text-secondary-600" />,
    beneficios: [
      'Notificações 24h antes dos outros',
      'Propostas prioritárias',
      'Filtros avançados de leads',
      'Relatórios de conversão',
      'Suporte dedicado',
    ],
    stripePriceId: 'price_LEADS_PRO_PLACEHOLDER',
    stripePriceIdAnual: 'price_LEADS_PRO_ANUAL_PLACEHOLDER',
  },
];

type Tab = 'anuncios' | 'oficinas' | 'leads';
type BillingCycle = 'mensal' | 'anual';

/** Calcula a percentagem de desconto do plano anual */
function calcDesconto(precoMensal: number, precoAnual: number): number {
  const totalMensal = precoMensal * 12;
  return Math.round(((totalMensal - precoAnual) / totalMensal) * 100);
}

export default function PlanosPremiumModal({ show, onClose }: PlanosPremiumModalProps) {
  const premiumConfig = usePremiumConfig();
  const [tab, setTab] = useState<Tab>('anuncios');
  const [billing, setBilling] = useState<BillingCycle>('anual');
  const [loading, setLoading] = useState<string | null>(null);

  const tabs = [
    { key: 'anuncios' as const, label: '🚗 Anúncios', active: premiumConfig.impulsionamento },
    { key: 'oficinas' as const, label: '🔧 Oficinas', active: premiumConfig.oficinas },
    { key: 'leads' as const, label: '📊 Leads', active: premiumConfig.leads },
  ].filter(t => t.active);

  // Fallback to first active tab if current tab is not active
  const activeTab = tabs.find(t => t.key === tab) ? tab : (tabs[0]?.key || 'anuncios');

  const planosAtivos =
    activeTab === 'anuncios'
      ? PLANOS_ANUNCIOS
      : activeTab === 'oficinas'
        ? PLANOS_OFICINAS
        : PLANOS_LEADS;

  /** Anúncios não têm opção anual */
  const showBillingToggle = activeTab !== 'anuncios';
  const isAnual = billing === 'anual';

  if (tabs.length === 0) {
    return (
      <Modal show={show} onClose={onClose} titulo="Planos & Impulsionamentos" tamanho="md">
        <div className="text-center py-8 px-4 space-y-3">
          <p className="text-4xl">💎</p>
          <h3 className="text-lg font-bold text-fg-heading">Planos Premium Indisponíveis</h3>
          <p className="text-sm text-fg-subtle leading-relaxed">
            De momento, todos os planos e serviços premium encontram-se temporariamente desativados pela administração.
          </p>
          <Button tipo="secundario" tamanho="md" onClick={onClose} blocoCompleto>
            Fechar
          </Button>
        </div>
      </Modal>
    );
  }

  const handleEscolherPlano = async (plano: Plano) => {
    setLoading(plano.id);

    const priceId = isAnual && plano.stripePriceIdAnual
      ? plano.stripePriceIdAnual
      : plano.stripePriceId;

    /* ──────────────────────────────────────────────────────────
     * INTEGRAÇÃO STRIPE — descomentar quando o endpoint estiver pronto:
     *
     * try {
     *   const res = await fetch('/api/stripe/checkout-session', {
     *     method: 'POST',
     *     headers: { 'Content-Type': 'application/json' },
     *     body: JSON.stringify({ priceId }),
     *   });
     *   const { url } = await res.json();
     *   if (url) window.location.href = url;
     * } catch (err) {
     *   console.error('Erro ao criar sessão Stripe:', err);
     * }
     * ────────────────────────────────────────────────────────── */

    // Temporário — simula carregamento e avisa que o Stripe ainda não está configurado
    setTimeout(() => {
      setLoading(null);
      alert(
        `Plano "${plano.nome}" (${isAnual ? 'Anual' : 'Mensal'}) selecionado!\n\n` +
        `Stripe Price ID: ${priceId}\n\n` +
        `A integração com o Stripe será ativada em breve. ` +
        `Configure o endpoint /api/stripe/checkout-session e substitua os Price IDs.`
      );
    }, 800);
  };

  return (
    <Modal show={show} onClose={onClose} titulo="Planos & Impulsionamentos" tamanho="xl">
      {/* Tab selector */}
      <div className="flex gap-1 p-1 bg-neutral-100 rounded-xl mb-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setBilling(t.key === 'anuncios' ? 'mensal' : 'anual'); }}
            className={`flex-1 py-2.5 px-3 text-sm font-bold rounded-lg transition-all duration-200 ${
              activeTab === t.key
                ? 'bg-white text-fg-heading shadow-sm'
                : 'text-fg-muted hover:text-fg-strong hover:bg-white/50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Billing toggle — only for oficinas & leads */}
      {showBillingToggle && (
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="relative flex items-center gap-1 p-1 bg-neutral-100 rounded-xl">
            <button
              onClick={() => setBilling('mensal')}
              className={`flex items-center gap-1.5 py-2 px-4 text-sm font-bold rounded-lg transition-all duration-200 ${
                !isAnual
                  ? 'bg-white text-fg-heading shadow-sm'
                  : 'text-fg-muted hover:text-fg-strong'
              }`}
            >
              <Clock size={16} weight="bold" />
              Mensal
            </button>
            <button
              onClick={() => setBilling('anual')}
              className={`flex items-center gap-1.5 py-2 px-4 text-sm font-bold rounded-lg transition-all duration-200 ${
                isAnual
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-sm'
                  : 'text-fg-muted hover:text-fg-strong'
              }`}
            >
              <CalendarBlank size={16} weight="bold" />
              Anual
            </button>
          </div>
          {!isAnual && (
            <span className="text-xs text-green-600 font-bold bg-green-50 px-2.5 py-1 rounded-full animate-pulse">
              💰 Poupe até 29% no plano anual!
            </span>
          )}
        </div>
      )}

      {/* Plans grid */}
      <div className={`grid gap-4 ${planosAtivos.length >= 3 ? 'md:grid-cols-3' : planosAtivos.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-1 max-w-md mx-auto'}`}>
        {planosAtivos.map((plano) => {
          const hasAnual = plano.precoMensal != null && plano.precoAnual != null;
          const desconto = hasAnual ? calcDesconto(plano.precoMensal!, plano.precoAnual!) : 0;
          const showAnual = isAnual && hasAnual;

          // Determine badge text
          const badgeText = showAnual
            ? (plano.badgeAnual || `Poupe ${desconto}%`)
            : plano.badge;

          // Determine if this plan should be highlighted
          const isHighlighted = showAnual
            ? true // all annual plans are highlighted to show savings
            : plano.destaque;

          // Find the biggest discount among current plans for "melhor oferta" ring
          const maxDesconto = planosAtivos.reduce((max, p) => {
            if (p.precoMensal && p.precoAnual) {
              const d = calcDesconto(p.precoMensal, p.precoAnual);
              return d > max ? d : max;
            }
            return max;
          }, 0);
          const isBestDeal = showAnual && hasAnual && desconto === maxDesconto && desconto > 0;

          return (
            <div
              key={plano.id}
              className={`relative rounded-2xl border-2 p-5 flex flex-col transition-all duration-300 hover:shadow-lg ${
                isBestDeal
                  ? 'border-green-400 bg-gradient-to-b from-green-50/60 to-white shadow-lg ring-2 ring-green-300/50 scale-[1.02]'
                  : isHighlighted
                    ? 'border-warning-400 bg-gradient-to-b from-warning-50/50 to-white shadow-md ring-1 ring-warning-200/50'
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
              }`}
            >
              {/* Badge de destaque */}
              {badgeText && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge
                    cor={isBestDeal ? 'green' : 'accent'}
                    variante="solid"
                  >
                    {badgeText}
                  </Badge>
                </div>
              )}

              {/* Header */}
              <div className="flex items-center gap-3 mb-3 mt-1">
                {plano.icon}
                <div>
                  <h4 className="text-base font-extrabold text-fg-heading leading-tight">{plano.nome}</h4>
                  <p className="text-xs text-fg-muted">{plano.descricao}</p>
                </div>
              </div>

              {/* Preço */}
              {showAnual ? (
                <div className="mb-4">
                  {/* Preço original riscado */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg text-fg-muted line-through font-semibold">
                      €{(plano.precoMensal! * 12)}
                    </span>
                    <span className="text-xs font-bold text-white bg-green-500 px-2 py-0.5 rounded-full">
                      -{desconto}%
                    </span>
                  </div>
                  {/* Preço anual */}
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-green-600">€{plano.precoAnual}</span>
                    <span className="text-sm text-fg-muted font-medium">/ano</span>
                  </div>
                  {/* Equivalente mensal */}
                  <p className="text-xs text-green-600 font-semibold mt-1">
                    ≈ €{(plano.precoAnual! / 12).toFixed(2)}/mês · Poupa €{(plano.precoMensal! * 12 - plano.precoAnual!)}
                  </p>
                </div>
              ) : (
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-extrabold text-fg-heading">{plano.preco}</span>
                  <span className="text-sm text-fg-muted font-medium">{plano.periodo}</span>
                </div>
              )}

              {/* Benefícios */}
              <ul className="space-y-2 mb-5 flex-1">
                {plano.beneficios.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-fg">
                    <CheckCircle size={18} weight="fill" className="text-success-500 shrink-0 mt-0.5" />
                    {b}
                  </li>
                ))}
                {/* Extra benefit for annual */}
                {showAnual && (
                  <li className="flex items-start gap-2 text-sm text-green-700 font-semibold">
                    <CheckCircle size={18} weight="fill" className="text-green-500 shrink-0 mt-0.5" />
                    Pagamento anual — sem preocupações
                  </li>
                )}
              </ul>

              {/* CTA */}
              <Button
                tipo={isBestDeal ? 'premium' : isHighlighted ? 'premium' : 'secundario'}
                tamanho="md"
                blocoCompleto
                carregando={loading === plano.id}
                iconeFim={<CaretRight size={16} weight="bold" />}
                onClick={() => handleEscolherPlano(plano)}
              >
                {showAnual ? 'Subscrever Anual' : 'Escolher Plano'}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Footer info */}
      <p className="text-xs text-fg-muted text-center mt-6">
        💳 Pagamento seguro via Stripe. Cancele a qualquer momento. Sem compromisso.
      </p>
    </Modal>
  );
}
