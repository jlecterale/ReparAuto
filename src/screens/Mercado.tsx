'use client';

import MarketDashboard from '@/components/preco/MarketDashboard';

export default function Mercado() {
  return (
    <div className="page-enter max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-900 flex items-center gap-2">
          <i className="fa-solid fa-chart-line text-accent"></i>
          Mercado
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Estatísticas em tempo real dos anúncios publicados no ReparAuto.
        </p>
      </div>

      <MarketDashboard />
    </div>
  );
}
