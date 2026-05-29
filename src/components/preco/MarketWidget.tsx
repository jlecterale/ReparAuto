'use client';

import Link from 'next/link';
import { ChartLineUp } from '@phosphor-icons/react';
import useMarketStats from '@/hooks/useMarketStats';
import { formatarPreco } from '@/lib/utils';
import { PRICE_THRESHOLDS } from '@/lib/constants';

interface Props {
  marca?: string;
  modelo?: string;
  title?: string;
}

export default function MarketWidget({ marca, modelo, title }: Props) {
  const { stats } = useMarketStats({ marca, modelo });

  if (!stats || stats.count < PRICE_THRESHOLDS.minPublicSampleSize) {
    return (
      <Link
        href="/mercado"
        className="block bg-white rounded-xl border border-neutral-200 p-4 hover:shadow-md transition no-underline"
      >
        <div className="flex items-center gap-2 mb-1 text-fg-muted text-xs font-bold uppercase">
          <ChartLineUp size={16} className="text-accent" />
          {title || 'Análise de mercado'}
        </div>
        <p className="text-sm text-fg-subtle">Explore as estatísticas do mercado de carros usados.</p>
      </Link>
    );
  }

  return (
    <Link
      href="/mercado"
      className="block bg-white rounded-xl border border-neutral-200 p-4 hover:shadow-md transition no-underline"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase text-fg-muted">
          <ChartLineUp size={14} className="text-accent inline mr-1 -mt-0.5" />
          {title || 'Mercado'}
        </span>
        <span className="text-[10px] text-fg-subtle">{stats.count} anúncios</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[10px] text-fg-muted">Mediana</p>
          <p className="text-sm font-bold text-fg-heading">{formatarPreco(stats.median)}</p>
        </div>
        <div>
          <p className="text-[10px] text-fg-muted">Mínimo</p>
          <p className="text-sm font-bold text-success-700">{formatarPreco(stats.min)}</p>
        </div>
        <div>
          <p className="text-[10px] text-fg-muted">Máximo</p>
          <p className="text-sm font-bold text-danger-700">{formatarPreco(stats.max)}</p>
        </div>
      </div>
    </Link>
  );
}
