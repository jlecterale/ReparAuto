'use client';

import {
  Equals,
  Question,
  Rocket,
  TrendDown,
  TrendUp,
  Warning,
  type Icon,
} from '@phosphor-icons/react';
import { PRICE_COLORS, PRICE_LABELS, PRICE_THRESHOLDS } from '@/lib/constants';
import type { PriceIndicator } from '@/types/preco';

interface Props {
  indicator: PriceIndicator;
  deviation?: number;
  sampleSize?: number;
  diffEuros?: number;
  compact?: boolean;
}

const INDICATOR_ICONS: Record<PriceIndicator, Icon> = {
  excelente: Rocket,
  bom: TrendDown,
  justo: Equals,
  acima: TrendUp,
  sobrevalorizado: Warning,
  indisponivel: Question,
};

function shortLabel(indicator: PriceIndicator): string {
  switch (indicator) {
    case 'excelente': return 'Excelente';
    case 'bom': return 'Bom preço';
    case 'justo': return 'Justo';
    case 'acima': return 'Acima';
    case 'sobrevalorizado': return 'Sobreval.';
    default: return 'Sem dados';
  }
}

export default function PriceIndicatorBadge({
  indicator,
  deviation = 0,
  sampleSize,
  diffEuros,
  compact = false,
}: Props) {
  const cor = PRICE_COLORS[indicator];
  const label = PRICE_LABELS[indicator];
  const IconEl = INDICATOR_ICONS[indicator];
  const pct = Math.round(Math.abs(deviation) * 100);
  const isLowConfidence =
    typeof sampleSize === 'number' &&
    sampleSize > 0 &&
    sampleSize < PRICE_THRESHOLDS.lowConfidenceSampleSize;
  const ariaLabel =
    indicator === 'indisponivel'
      ? 'Sem dados de mercado'
      : `${label}${pct > 0 ? `, ${pct} por cento ${deviation < 0 ? 'abaixo' : 'acima'} da mediana` : ''}${
          typeof sampleSize === 'number' ? `, ${sampleSize} anúncios` : ''
        }`;

  if (compact) {
    return (
      <span
        role="img"
        aria-label={ariaLabel}
        title={label}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cor.bg} ${cor.text} ${cor.border}`}
      >
        <IconEl size={12} weight="fill" aria-hidden="true" />
        {shortLabel(indicator)}
      </span>
    );
  }

  const diffSign = (diffEuros ?? 0) >= 0 ? '+' : '−';
  const diffAbs = Math.abs(diffEuros ?? 0);

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border ${cor.bg} ${cor.text} ${cor.border}`}
    >
      <IconEl size={16} weight="fill" aria-hidden="true" />
      <span>{label}</span>
      {indicator !== 'indisponivel' && typeof diffEuros === 'number' && diffEuros !== 0 && (
        <span className="opacity-80">
          ({diffSign}{diffAbs.toLocaleString('pt-PT')} €)
        </span>
      )}
      {indicator !== 'indisponivel' && pct > 0 && typeof diffEuros !== 'number' && (
        <span className="opacity-75">
          ({deviation < 0 ? '−' : '+'}{pct}%)
        </span>
      )}
      {typeof sampleSize === 'number' && sampleSize > 0 && (
        <span className="text-[10px] opacity-60 ml-1">
          · {sampleSize} {sampleSize === 1 ? 'anúncio' : 'anúncios'}
          {isLowConfidence && <span title="Baixa confiança"> *</span>}
        </span>
      )}
    </div>
  );
}
