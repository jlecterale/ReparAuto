'use client';

import { ChartLineUp, CircleNotch } from '@phosphor-icons/react';
import { useApp } from '@/providers/AppProvider';
import MarketDashboard from '@/components/preco/MarketDashboard';

export default function Mercado() {
  const { carros } = useApp();

  return (
    <div className="page-enter max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-fg-heading flex items-center gap-2">
          <ChartLineUp className="text-accent" /> Mercado
        </h1>
        <p className="text-sm text-fg-muted mt-1">
          Estatísticas em tempo real dos anúncios publicados no RecarGarage.
        </p>
      </div>

      {carros.loading && carros.carros.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-fg-muted">
          <CircleNotch size={32} className="animate-spin text-accent mb-3" />
          <p className="text-sm">A carregar dados de mercado…</p>
        </div>
      ) : (
        <MarketDashboard />
      )}
    </div>
  );
}
