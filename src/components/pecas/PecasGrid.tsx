'use client';

import { Package, PlusCircle } from '@phosphor-icons/react';
import { useApp } from '@/providers/AppProvider';
import PecasCard from './PecasCard';
import { PecaCardSkeleton } from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';
import type { Peca } from '@/types/peca';

export default function PecasGrid({
  onDetalhes,
  onPublicar,
}: {
  onDetalhes: (peca: Peca) => void;
  onPublicar: () => void;
}) {
  const { pecas } = useApp();
  const { pecasFiltradas, pecas: allPecas, loading } = pecas;

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
    if (allPecas.length === 0) {
      return (
        <div className="text-center py-12 text-fg-subtle">
          <Package className="text-4xl mb-3 mx-auto text-slate-300" />
          <p className="font-semibold text-fg-strong">Anuncie sua peça gratuitamente</p>
          <p className="text-sm">Seja o primeiro a anunciar uma peça aqui.</p>
          <Button
            tipo="primario"
            icone={<PlusCircle />}
            onClick={onPublicar}
            className="rounded-full mt-5"
          >
            Anunciar peça
          </Button>
        </div>
      );
    }
    return (
      <div className="text-center py-12 text-fg-subtle">
        <Package className="text-4xl mb-3 mx-auto text-slate-300" />
        <p className="font-semibold">Nenhum anúncio encontrado</p>
        <p className="text-sm">Experimente alterar o filtro de pesquisa.</p>
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
