'use client';

import { useMemo } from 'react';
import { useApp } from '@/providers/AppProvider';
import { formatarPreco } from '@/lib/utils';
import { docCountry } from '@/lib/country';
import type { Peca } from '@/types/peca';

interface Props {
  peca: Peca;
}

interface Comparison {
  label: string;
  color: 'green' | 'amber' | 'red' | 'slate';
  icon: string;
  detail: string;
}

function buildComparison(peca: Peca, similares: Peca[]): Comparison | null {
  if (peca.preco == null) return null;

  if (peca.precoNovoReferencia && peca.precoNovoReferencia > 0) {
    const diff = peca.preco / peca.precoNovoReferencia;
    if (diff <= 0.5) {
      return {
        label: 'Excelente vs novo',
        color: 'green',
        icon: 'fa-solid fa-arrow-trend-down',
        detail: `${Math.round((1 - diff) * 100)}% abaixo do preço de catálogo (${formatarPreco(peca.precoNovoReferencia, docCountry(peca))})`,
      };
    }
    if (diff <= 0.85) {
      return {
        label: 'Bom vs novo',
        color: 'amber',
        icon: 'fa-solid fa-tag',
        detail: `${Math.round((1 - diff) * 100)}% abaixo do preço de catálogo (${formatarPreco(peca.precoNovoReferencia, docCountry(peca))})`,
      };
    }
    return {
      label: 'Perto do preço novo',
      color: 'red',
      icon: 'fa-solid fa-circle-exclamation',
      detail: `Catálogo: ${formatarPreco(peca.precoNovoReferencia, docCountry(peca))}`,
    };
  }

  const pool = similares.filter(
    (p) =>
      p.id !== peca.id &&
      p.preco != null &&
      p.preco > 0 &&
      p.categoria === peca.categoria &&
      p.marcaCarro?.toLowerCase() === peca.marcaCarro?.toLowerCase(),
  );

  if (pool.length < 2) return null;

  const precos = pool.map((p) => p.preco as number);
  const media = precos.reduce((s, n) => s + n, 0) / precos.length;
  const ratio = peca.preco / media;

  if (ratio < 0.8) {
    return {
      label: 'Abaixo da média',
      color: 'green',
      icon: 'fa-solid fa-arrow-trend-down',
      detail: `Média mercado: ${formatarPreco(media, docCountry(peca))} (${pool.length} anúncios)`,
    };
  }
  if (ratio > 1.2) {
    return {
      label: 'Acima da média',
      color: 'red',
      icon: 'fa-solid fa-arrow-trend-up',
      detail: `Média mercado: ${formatarPreco(media, docCountry(peca))} (${pool.length} anúncios)`,
    };
  }
  return {
    label: 'Na média',
    color: 'slate',
    icon: 'fa-solid fa-scale-balanced',
    detail: `Média mercado: ${formatarPreco(media, docCountry(peca))} (${pool.length} anúncios)`,
  };
}

const colorClasses: Record<Comparison['color'], string> = {
  green: 'bg-green-50 border-green-200 text-green-700',
  amber: 'bg-amber-50 border-amber-200 text-amber-700',
  red: 'bg-red-50 border-red-200 text-red-700',
  slate: 'bg-slate-50 border-slate-200 text-slate-700',
};

export default function PriceReferenceBadge({ peca }: Props) {
  const { pecas } = useApp();
  const cmp = useMemo(() => buildComparison(peca, pecas.pecas), [peca, pecas.pecas]);
  if (!cmp) return null;

  return (
    <div className={`inline-flex flex-col gap-0.5 border rounded-lg px-3 py-1.5 ${colorClasses[cmp.color]}`}>
      <span className="text-xs font-bold flex items-center gap-1">
        <i className={cmp.icon}></i>
        {cmp.label}
      </span>
      <span className="text-[11px] opacity-90">{cmp.detail}</span>
    </div>
  );
}
