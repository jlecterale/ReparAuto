'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/providers/AppProvider';
import { pecaCompatibleWithCar } from '@/lib/compatibility';
import { formatarPreco } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import type { Carro } from '@/types/carro';
import type { Peca } from '@/types/peca';

interface Props {
  carro: Carro;
  onSelect?: (peca: Peca) => void;
  limit?: number;
}

export default function CompatibleParts({ carro, onSelect, limit = 12 }: Props) {
  const { pecas } = useApp();
  const { pecas: allPecas, loading } = pecas;

  const compativeis = useMemo(
    () => allPecas.filter((p) => pecaCompatibleWithCar(p, carro)).slice(0, limit),
    [allPecas, carro, limit],
  );

  if (loading) {
    return (
      <div className="text-xs text-slate-400 flex items-center gap-2">
        <i className="fa-solid fa-spinner fa-spin"></i> A procurar peças compatíveis…
      </div>
    );
  }

  if (compativeis.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-500">
        <i className="fa-solid fa-circle-info mr-1"></i>
        Ainda não há peças compatíveis publicadas para este veículo.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-extrabold text-brand-900 flex items-center gap-2">
          <i className="fa-solid fa-gears text-accent"></i>
          Peças Compatíveis
        </h3>
        <span className="text-xs text-slate-500">{compativeis.length} encontrada(s)</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {compativeis.map((p) => {
          const inner = (
            <div className="bg-white border border-slate-200 hover:border-accent hover:shadow-md rounded-xl p-3 transition cursor-pointer h-full flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="font-semibold text-sm text-brand-900 line-clamp-2">{p.titulo}</h4>
                {p.preco != null && (
                  <span className="text-sm font-extrabold text-accent whitespace-nowrap">
                    {formatarPreco(p.preco)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mb-1">
                <Badge cor="blue">{p.categoria}</Badge>
                <span className="text-[11px] text-slate-500">{p.estado}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-auto">
                <i className="fa-solid fa-location-dot mr-1"></i>
                {p.local || 'Portugal'}
              </p>
            </div>
          );
          return onSelect ? (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p)}
              className="text-left"
            >
              {inner}
            </button>
          ) : (
            <Link key={p.id} href={`/pecas/${p.id}`} className="block">
              {inner}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
