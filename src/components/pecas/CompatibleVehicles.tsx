'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/providers/AppProvider';
import { carMatchesPeca } from '@/lib/compatibility';
import { formatarPreco } from '@/lib/utils';
import { docCountry } from '@/lib/country';
import type { Peca } from '@/types/peca';

interface Props {
  peca: Peca;
  limit?: number;
}

export default function CompatibleVehicles({ peca, limit = 8 }: Props) {
  const { carros } = useApp();
  const { carros: allCarros, loading } = carros;

  const compativeis = useMemo(
    () => allCarros.filter((c) => carMatchesPeca(c, peca)).slice(0, limit),
    [allCarros, peca, limit],
  );

  if (loading || compativeis.length === 0) return null;

  return (
    <div className="pt-3 border-t border-slate-200">
      <h4 className="font-bold text-sm text-brand-900 mb-2 flex items-center gap-2">
        <i className="fa-solid fa-car-side text-accent"></i>
        Veículos Compatíveis ({compativeis.length})
      </h4>
      <div className="space-y-2">
        {compativeis.map((c) => (
          <Link
            key={c.id}
            href={`/detalhes/${c.id}`}
            className="flex items-center justify-between gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 transition"
          >
            <div className="min-w-0">
              <p className="font-semibold text-xs text-brand-900 truncate">
                {c.marca} {c.modelo}
              </p>
              <p className="text-[11px] text-slate-500">
                {c.anoFabricacao} · {c.km?.toLocaleString('pt-PT')} km · {c.local || 'Portugal'}
              </p>
            </div>
            <span className="text-xs font-extrabold text-accent whitespace-nowrap">
              {formatarPreco(c.preco, docCountry(c))}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
