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
  X,
} from '@phosphor-icons/react';
import type { Usuario, CategoriaPlano } from '@/types/usuario';
import Modal from '@/components/ui/Modal';
import usePremiumConfig from '@/hooks/usePremiumConfig';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

interface GrantPlanModalProps {
  show: boolean;
  user: Usuario | null;
  adminUid: string;
  adminNome: string;
  onClose: () => void;
  onGrant: (uid: string, planoId: string, nome: string, categoria: CategoriaPlano, dias: number) => Promise<void>;
  onRevoke: (uid: string) => Promise<void>;
}

interface PlanoDef {
  id: string;
  nome: string;
  descricao: string;
  categoria: CategoriaPlano;
  icon: React.ReactNode;
  badge?: string;
  precoRef: string;
  duracoesPadrao: number[];
}

const PLANOS: PlanoDef[] = [
  {
    id: 'impulso-7d',
    nome: 'Impulso 7 dias',
    descricao: 'Destaque no topo da lista durante 7 dias.',
    categoria: 'anuncios',
    icon: <Rocket size={24} weight="duotone" className="text-secondary-500" />,
    duracoesPadrao: [7, 14, 30],
    precoRef: '€2,99',
  },
  {
    id: 'impulso-30d',
    nome: 'Impulso 30 dias',
    descricao: 'Destaque contínuo durante 1 mês.',
    categoria: 'anuncios',
    icon: <Star size={24} weight="duotone" className="text-warning-400" />,
    badge: 'Mais Popular',
    duracoesPadrao: [30, 60, 90],
    precoRef: '€7,99',
  },
  {
    id: 'turbo',
    nome: 'Turbo',
    descricao: 'Máxima exposição com banner na página principal.',
    categoria: 'anuncios',
    icon: <Lightning size={24} weight="duotone" className="text-danger-500" />,
    duracoesPadrao: [30, 60, 90],
    precoRef: '€14,99',
  },
  {
    id: 'oficina-basico',
    nome: 'Oficina Verificada',
    descricao: 'Selo de confiança e presença na listagem.',
    categoria: 'oficinas',
    icon: <Wrench size={24} weight="duotone" className="text-primary-500" />,
    duracoesPadrao: [30, 60, 90, 180],
    precoRef: '€15/mês',
  },
  {
    id: 'oficina-pro',
    nome: 'Oficina Pro',
    descricao: 'Topo das buscas e chat ilimitado.',
    categoria: 'oficinas',
    icon: <Crown size={24} weight="duotone" className="text-warning-400" />,
    badge: 'Recomendado',
    duracoesPadrao: [30, 60, 90, 180],
    precoRef: '€35/mês',
  },
  {
    id: 'leads-pro',
    nome: 'Leads Prioritários',
    descricao: 'Acesso antecipado a intenções de compra.',
    categoria: 'leads',
    icon: <Storefront size={24} weight="duotone" className="text-secondary-600" />,
    duracoesPadrao: [30, 60, 90],
    precoRef: '€50/mês',
  },
];

const DIAS_OPTIONS = [7, 14, 30, 60, 90, 180];

export default function GrantPlanModal({
  show,
  user,
  adminUid,
  adminNome,
  onClose,
  onGrant,
  onRevoke,
}: GrantPlanModalProps) {
  const premiumConfig = usePremiumConfig();
  const [selectedPlano, setSelectedPlano] = useState<string | null>(null);
  const [dias, setDias] = useState(30);
  const [loading, setLoading] = useState(false);
  const [revoking, setRevoking] = useState(false);

  if (!user) return null;

  const planosFiltrados = PLANOS;

  const planoAtivo = user.planoAtivo;
  const hasActivePlan = planoAtivo && planoAtivo.dataExpiracao?.toMillis?.() > Date.now();

  const handleGrant = async () => {
    if (!selectedPlano) return;
    const plano = PLANOS.find((p) => p.id === selectedPlano);
    if (!plano) return;
    setLoading(true);
    try {
      await onGrant(user.uid, plano.id, plano.nome, plano.categoria, dias);
      setSelectedPlano(null);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    setRevoking(true);
    try {
      await onRevoke(user.uid);
      onClose();
    } finally {
      setRevoking(false);
    }
  };

  return (
    <Modal show={show} onClose={onClose} titulo="Gerir Planos" tamanho="lg">
      <div className="space-y-5">
        {/* User info */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <p className="text-sm font-bold text-fg-heading">{user.nome || user.email}</p>
          <p className="text-xs text-fg-muted">{user.email} • {user.uid}</p>
          {hasActivePlan ? (
            <div className="mt-2 flex items-center gap-2">
              <Badge cor="green">Plano Ativo: {planoAtivo!.nome}</Badge>
              <span className="text-[10px] text-fg-subtle">
                (expira {new Date(planoAtivo!.dataExpiracao.toMillis()).toLocaleDateString('pt-PT')})
              </span>
            </div>
          ) : (
            <p className="mt-2 text-xs text-fg-subtle">Sem plano ativo</p>
          )}
        </div>

        {/* Plan selector */}
        <div>
          <p className="text-xs font-bold text-fg-heading uppercase tracking-wider mb-2">Escolher Plano</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {planosFiltrados.map((plano) => (
              <button
                key={plano.id}
                type="button"
                onClick={() => {
                  setSelectedPlano(plano.id);
                  if (!DIAS_OPTIONS.includes(dias) && plano.duracoesPadrao.length > 0) {
                    setDias(plano.duracoesPadrao[0]);
                  }
                }}
                className={`relative flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                  selectedPlano === plano.id
                    ? 'border-accent bg-accent/5 ring-1 ring-accent/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {plano.badge && (
                  <div className="absolute -top-2 -right-2">
                    <Badge cor="accent" variante="solid" tamanho="sm">{plano.badge}</Badge>
                  </div>
                )}
                <div className="shrink-0 mt-0.5">{plano.icon}</div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-fg-heading">{plano.nome}</p>
                  <p className="text-[11px] text-fg-muted">{plano.descricao}</p>
                  <p className="text-[10px] text-fg-subtle mt-0.5">{plano.precoRef}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Duration selector */}
        {selectedPlano && (
          <div>
            <p className="text-xs font-bold text-fg-heading uppercase tracking-wider mb-2">Duração</p>
            <div className="flex flex-wrap gap-2">
              {DIAS_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDias(d)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border-2 transition-all ${
                    dias === d
                      ? 'border-accent bg-accent text-white'
                      : 'border-slate-200 bg-white text-fg-muted hover:border-slate-300'
                  }`}
                >
                  {d >= 30 ? `${d / 30} ${d === 30 ? 'mês' : 'meses'}` : `${d} dias`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
          {hasActivePlan ? (
            <Button
              tipo="perigo"
              tamanho="sm"
              onClick={handleRevoke}
              carregando={revoking}
              icone={<X size={14} />}
            >
              Remover Plano
            </Button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <Button tipo="secundario" tamanho="md" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              tipo="primario"
              tamanho="md"
              onClick={handleGrant}
              disabled={!selectedPlano}
              carregando={loading}
            >
              Conceder Plano
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
