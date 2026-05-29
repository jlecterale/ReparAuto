'use client';

import { Package } from '@phosphor-icons/react';
import { useApp } from '@/providers/AppProvider';
import PecasCard from './PecasCard';
import { PecaCardSkeleton } from '@/components/ui/Skeleton';
import type { Peca } from '@/types/peca';

export default function PecasGrid({ onDetalhes }: { onDetalhes: (peca: Peca) => void }) {
  const { pecas } = useApp();
  const { pecasFiltradas, loading } = pecas;

  const filtered = pecasFiltradas;

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <PecaCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="text-center py-12 text-fg-subtle">
        <Package className="text-4xl mb-3 text-slate-300" />
        <p className="font-semibold">Nenhum anúncio encontrado</p>
        <p className="text-sm">Experimente alterar o filtro ou publique o seu primeiro anúncio!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {filtered.map((peca) => (
        <PecasCard key={peca.id} peca={peca} onDetalhes={onDetalhes} />
      ))}
    </div>
  );
}
