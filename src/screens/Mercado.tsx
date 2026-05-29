'use client';

import { ChartLineUp } from '@phosphor-icons/react';
import MarketDashboard from '@/components/preco/MarketDashboard';

export default function Mercado() {
  return (
    <div className="page-enter max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-fg-heading flex items-center gap-2">
          <ChartLineUp className="text-accent" /> Mercado
        </h1>
        <p className="text-sm text-fg-muted mt-1">
          Estatísticas em tempo real dos anúncios publicados no ReparAuto.
        </p>
      </div>

      <MarketDashboard />
    </div>
  );
}
