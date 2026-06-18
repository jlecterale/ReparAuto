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
} from '@phosphor-icons/react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

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
  destaque: boolean;
  badge?: string;
  icon: React.ReactNode;
  beneficios: string[];
  /** Stripe Price ID — preencher após configuração do Stripe */
  stripePriceId: string;
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
    destaque: false,
    icon: <Wrench size={28} weight="duotone" className="text-primary-500" />,
    beneficios: [
      'Selo "Verificada" no perfil',
      'Listagem na secção Oficinas',
      'Chat com clientes (5/mês)',
      'Perfil personalizado',
    ],
    stripePriceId: 'price_OFICINA_BASICO_PLACEHOLDER',
  },
  {
    id: 'oficina-pro',
    nome: 'Oficina Pro',
    descricao: 'Topo das buscas geográficas e chat ilimitado.',
    preco: '€35',
    periodo: '/mês',
    destaque: true,
    badge: 'Recomendado',
    icon: <Crown size={28} weight="duotone" className="text-warning-400" />,
    beneficios: [
      'Tudo do plano Verificada',
      'Topo das buscas na região',
      'Chat ilimitado com clientes',
      'Destaque no mapa',
      'Badge Premium dourado',
    ],
    stripePriceId: 'price_OFICINA_PRO_PLACEHOLDER',
  },
];

const PLANOS_LEADS: Plano[] = [
  {
    id: 'leads-pro',
    nome: 'Leads Prioritários',
    descricao: 'Acesso antecipado a intenções de compra.',
    preco: '€50',
    periodo: '/mês',
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
  },
];

type Tab = 'anuncios' | 'oficinas' | 'leads';

export default function PlanosPremiumModal({ show, onClose }: PlanosPremiumModalProps) {
  const [tab, setTab] = useState<Tab>('anuncios');
  const [loading, setLoading] = useState<string | null>(null);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'anuncios', label: '🚗 Anúncios' },
    { key: 'oficinas', label: '🔧 Oficinas' },
    { key: 'leads', label: '📊 Leads' },
  ];

  const planosAtivos =
    tab === 'anuncios'
      ? PLANOS_ANUNCIOS
      : tab === 'oficinas'
        ? PLANOS_OFICINAS
        : PLANOS_LEADS;

  const handleEscolherPlano = async (plano: Plano) => {
    setLoading(plano.id);

    /* ──────────────────────────────────────────────────────────
     * INTEGRAÇÃO STRIPE — descomentar quando o endpoint estiver pronto:
     *
     * try {
     *   const res = await fetch('/api/stripe/checkout-session', {
     *     method: 'POST',
     *     headers: { 'Content-Type': 'application/json' },
     *     body: JSON.stringify({ priceId: plano.stripePriceId }),
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
        `Plano "${plano.nome}" selecionado!\n\n` +
        `Stripe Price ID: ${plano.stripePriceId}\n\n` +
        `A integração com o Stripe será ativada em breve. ` +
        `Configure o endpoint /api/stripe/checkout-session e substitua os Price IDs.`
      );
    }, 800);
  };

  return (
    <Modal show={show} onClose={onClose} titulo="Planos & Impulsionamentos" tamanho="xl">
      {/* Tab selector */}
      <div className="flex gap-1 p-1 bg-neutral-100 rounded-xl mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 px-3 text-sm font-bold rounded-lg transition-all duration-200 ${
              tab === t.key
                ? 'bg-white text-fg-heading shadow-sm'
                : 'text-fg-muted hover:text-fg-strong hover:bg-white/50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Plans grid */}
      <div className={`grid gap-4 ${planosAtivos.length >= 3 ? 'md:grid-cols-3' : planosAtivos.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-1 max-w-md mx-auto'}`}>
        {planosAtivos.map((plano) => (
          <div
            key={plano.id}
            className={`relative rounded-2xl border-2 p-5 flex flex-col transition-all duration-200 hover:shadow-lg ${
              plano.destaque
                ? 'border-warning-400 bg-gradient-to-b from-warning-50/50 to-white shadow-md ring-1 ring-warning-200/50'
                : 'border-neutral-200 bg-white hover:border-neutral-300'
            }`}
          >
            {/* Badge de destaque */}
            {plano.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge cor="accent" variante="solid">
                  {plano.badge}
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
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-3xl font-extrabold text-fg-heading">{plano.preco}</span>
              <span className="text-sm text-fg-muted font-medium">{plano.periodo}</span>
            </div>

            {/* Benefícios */}
            <ul className="space-y-2 mb-5 flex-1">
              {plano.beneficios.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-fg">
                  <CheckCircle size={18} weight="fill" className="text-success-500 shrink-0 mt-0.5" />
                  {b}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Button
              tipo={plano.destaque ? 'premium' : 'secundario'}
              tamanho="md"
              blocoCompleto
              carregando={loading === plano.id}
              iconeFim={<CaretRight size={16} weight="bold" />}
              onClick={() => handleEscolherPlano(plano)}
            >
              Escolher Plano
            </Button>
          </div>
        ))}
      </div>

      {/* Footer info */}
      <p className="text-xs text-fg-muted text-center mt-6">
        💳 Pagamento seguro via Stripe. Cancele a qualquer momento. Sem compromisso.
      </p>
    </Modal>
  );
}
