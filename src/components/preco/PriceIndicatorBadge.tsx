'use client';

import { PRICE_COLORS, PRICE_LABELS } from '@/lib/constants';
import type { PriceIndicator } from '@/types/preco';

interface Props {
  indicator: PriceIndicator;
  deviation?: number;
  sampleSize?: number;
  compact?: boolean;
}

export default function PriceIndicatorBadge({
  indicator,
  deviation = 0,
  sampleSize,
  compact = false,
}: Props) {
  const cor = PRICE_COLORS[indicator];
  const label = PRICE_LABELS[indicator];
  const pct = Math.round(Math.abs(deviation) * 100);

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cor.bg} ${cor.text} ${cor.border}`}
        title={label}
      >
        <i className={cor.icon}></i>
        {indicator === 'indisponivel' ? 'Sem dados' : label.split(' ')[0]}
      </span>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border ${cor.bg} ${cor.text} ${cor.border}`}
    >
      <i className={cor.icon}></i>
      <span>{label}</span>
      {indicator !== 'indisponivel' && pct > 0 && (
        <span className="opacity-75">
          ({indicator === 'abaixo' ? '-' : '+'}{pct}%)
        </span>
      )}
      {typeof sampleSize === 'number' && sampleSize > 0 && (
        <span className="text-[10px] opacity-60 ml-1">
          · {sampleSize} {sampleSize === 1 ? 'anúncio' : 'anúncios'}
        </span>
      )}
    </div>
  );
}
