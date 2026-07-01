'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChartLineUp, ListChecks, Target, UsersThree, CircleNotch, Plus, type Icon } from '@phosphor-icons/react';
import { useApp } from '@/providers/AppProvider';
import Alert from '@/components/ui/Alert';
import usePainel from '@/hooks/usePainel';
import DashboardKpiCards from '@/components/painel/DashboardKpiCards';
import MetricsTimeChart from '@/components/painel/MetricsTimeChart';
import InventoryPerformanceTable from '@/components/painel/InventoryPerformanceTable';
import LeadsInbox from '@/components/painel/LeadsInbox';
import ClientsTab from '@/components/painel/ClientsTab';
import Button from '@/components/ui/Button';
import { DASHBOARD_PERIODS } from '@/lib/constants';
import type { DashboardPeriod } from '@/types/dashboard';

type Tab = 'visao-geral' | 'anuncios' | 'leads' | 'clientes';

const TABS: { value: Tab; label: string; Icon: Icon }[] = [
  { value: 'visao-geral', label: 'Visão geral', Icon: ChartLineUp },
  { value: 'anuncios', label: 'Anúncios', Icon: ListChecks },
  { value: 'leads', label: 'Leads', Icon: Target },
  { value: 'clientes', label: 'Clientes', Icon: UsersThree },
];

export default function PainelProfissional() {
  const { auth } = useApp();
  const { user, isLoggedIn, loading: authLoading } = auth;
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('visao-geral');
  const [period, setPeriod] = useState<DashboardPeriod>(30);

  const isPro = user?.tipoConta === 'profissional';

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn || !isPro) router.replace('/perfil');
  }, [authLoading, isLoggedIn, isPro, router]);

  const { carros, pecas, points, summary, loading } = usePainel(isPro ? user : null, period);

  if (authLoading || !isLoggedIn || !isPro) {
    return (
      <div className="flex items-center justify-center py-24 text-fg-muted">
        <CircleNotch className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="page-enter max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-fg-heading">Painel Profissional</h1>
          <p className="text-sm text-fg-muted mt-1">
            Desempenho dos seus anúncios e gestão dos seus clientes.
          </p>
        </div>
        <Button tipo="primario" tamanho="sm" icone={<Plus />} onClick={() => router.push('/anunciar')}>
          Novo anúncio
        </Button>
      </header>

      {user?.emailVerified === false && (
        <Alert tipo="aviso" titulo="Email por verificar">
          As estatísticas e a lista de clientes só carregam depois de confirmar o seu email — use o
          aviso no topo da página para reenviar a confirmação.
        </Alert>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-neutral-200 overflow-x-auto scrollbar-hide" role="tablist">
        {TABS.map((t) => {
          const active = tab === t.value;
          return (
            <button
              key={t.value}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.value)}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold whitespace-nowrap border-b-2 -mb-px transition ${
                active
                  ? 'border-accent text-accent'
                  : 'border-transparent text-fg-muted hover:text-fg'
              }`}
            >
              <t.Icon weight={active ? 'fill' : 'regular'} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'visao-geral' && (
        <div className="space-y-5">
          <div className="flex justify-end">
            <div className="inline-flex rounded-xl border border-neutral-200 bg-white p-0.5" role="group" aria-label="Período">
              {DASHBOARD_PERIODS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                    period === p.value ? 'bg-accent text-white' : 'text-fg-muted hover:text-fg'
                  }`}
                  aria-pressed={period === p.value}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-fg-muted">
              <CircleNotch className="animate-spin" size={28} />
            </div>
          ) : (
            <>
              <DashboardKpiCards summary={summary} period={period} />
              <MetricsTimeChart points={points} />
            </>
          )}
        </div>
      )}

      {tab === 'anuncios' && (
        loading ? (
          <div className="flex items-center justify-center py-16 text-fg-muted">
            <CircleNotch className="animate-spin" size={28} />
          </div>
        ) : (
          <InventoryPerformanceTable carros={carros} pecas={pecas} />
        )
      )}

      {tab === 'leads' && user && <LeadsInbox vendedorId={user.uid} />}

      {tab === 'clientes' && user && <ClientsTab ownerUid={user.uid} />}
    </div>
  );
}
