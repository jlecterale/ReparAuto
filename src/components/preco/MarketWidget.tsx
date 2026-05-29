'use client';

import Link from 'next/link';
import useMarketStats from '@/hooks/useMarketStats';
import { formatarPreco } from '@/lib/utils';

interface Props {
  marca?: string;
  modelo?: string;
  title?: string;
}

export default function MarketWidget({ marca, modelo, title }: Props) {
  const { stats } = useMarketStats({ marca, modelo });

  if (!stats || stats.count === 0) {
    return (
      <Link
        href="/mercado"
        className="block bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md transition no-underline"
      >
        <div className="flex items-center gap-2 mb-1 text-slate-600 text-xs font-bold uppercase">
          <i className="fa-solid fa-chart-line text-accent"></i>
          {title || 'Análise de mercado'}
        </div>
        <p className="text-sm text-slate-400">Explore as estatísticas do mercado de carros usados.</p>
      </Link>
    );
  }

  return (
    <Link
      href="/mercado"
      className="block bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md transition no-underline"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase text-slate-600">
          <i className="fa-solid fa-chart-line text-accent mr-1"></i>
          {title || 'Mercado'}
        </span>
        <span className="text-[10px] text-slate-400">{stats.count} anúncios</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[10px] text-slate-500">Mediana</p>
          <p className="text-sm font-bold text-brand-900">{formatarPreco(stats.median)}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-500">Mínimo</p>
          <p className="text-sm font-bold text-green-600">{formatarPreco(stats.min)}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-500">Máximo</p>
          <p className="text-sm font-bold text-red-600">{formatarPreco(stats.max)}</p>
        </div>
      </div>
    </Link>
  );
}
