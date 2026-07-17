'use client';

import { Eye, ChatCircle, Heart, ListChecks, Clock, TrendUp, TrendDown, type Icon } from '@phosphor-icons/react';
import type { DashboardSummary, DashboardPeriod } from '@/types/dashboard';

interface Props {
  summary: DashboardSummary;
  period: DashboardPeriod;
}

function delta(current: number, previous: number): { pct: number; up: boolean } | null {
  if (previous === 0) return current > 0 ? { pct: 100, up: true } : null;
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return null;
  return { pct: Math.abs(pct), up: pct > 0 };
}

export default function DashboardKpiCards({ summary, period }: Props) {
  const taxaContacto =
    summary.viewsPeriodo > 0 ? Math.round((summary.contactsPeriodo / summary.viewsPeriodo) * 100) : 0;

  const cards: {
    label: string;
    value: string | number;
    Icon: Icon;
    cor: string;
    sub?: string;
    trend?: { pct: number; up: boolean } | null;
  }[] = [
    { label: 'Anúncios ativos', value: summary.anunciosAtivos, Icon: ListChecks, cor: 'bg-accent' },
    { label: 'Pendentes', value: summary.anunciosPendentes, Icon: Clock, cor: 'bg-warning-500' },
    {
      label: `Visualizações (${period}d)`,
      value: summary.viewsPeriodo,
      Icon: Eye,
      cor: 'bg-primary-600',
      trend: delta(summary.viewsPeriodo, summary.viewsPeriodoAnterior),
    },
    {
      label: `Contactos (${period}d)`,
      value: summary.contactsPeriodo,
      Icon: ChatCircle,
      cor: 'bg-success-600',
      trend: delta(summary.contactsPeriodo, summary.contactsPeriodoAnterior),
    },
    { label: 'Favoritos', value: summary.favoritosTotais, Icon: Heart, cor: 'bg-pink-600' },
    {
      label: 'Taxa de contacto',
      value: `${taxaContacto}%`,
      Icon: TrendUp,
      cor: 'bg-purple-600',
      sub: 'contactos ÷ visualizações',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-4 flex flex-col gap-2"
        >
          <div className="flex items-center justify-between">
            <div className={`${c.cor} w-9 h-9 rounded-lg flex items-center justify-center text-white`}>
              <c.Icon weight="fill" />
            </div>
            {c.trend && (
              <span
                className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${
                  c.trend.up ? 'text-success-700' : 'text-danger-600'
                }`}
                title="Variação vs. período anterior"
              >
                {c.trend.up ? <TrendUp weight="bold" /> : <TrendDown weight="bold" />}
                {c.trend.pct}%
              </span>
            )}
          </div>
          <div>
            <p className="text-2xl font-extrabold text-fg-heading leading-tight">{c.value}</p>
            <p className="text-[11px] text-fg-subtle font-semibold uppercase tracking-wide">{c.label}</p>
            {c.sub && <p className="text-[10px] text-fg-muted mt-0.5">{c.sub}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
