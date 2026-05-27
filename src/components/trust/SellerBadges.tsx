import { BADGES_CONFIANCA } from '@/lib/constants';

interface SellerBadgesProps {
  verificado?: boolean;
  badges?: string[];
  mediaAvaliacoes?: number;
  totalAvaliacoes?: number;
  compact?: boolean;
}

export default function SellerBadges({
  verificado,
  badges = [],
  mediaAvaliacoes,
  totalAvaliacoes,
  compact = false,
}: SellerBadgesProps) {
  const allBadges = [...new Set(verificado ? ['verificado', ...badges] : badges)];
  const activeBadges = BADGES_CONFIANCA.filter((b) => allBadges.includes(b.key));

  if (activeBadges.length === 0 && !totalAvaliacoes) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {activeBadges.map((badge) => (
          <span key={badge.key} className={`${badge.cor} text-xs`} title={badge.label}>
            <i className={badge.icon}></i>
          </span>
        ))}
        {!!totalAvaliacoes && totalAvaliacoes > 0 && (
          <span className="text-xs text-yellow-500 flex items-center gap-0.5" title={`${mediaAvaliacoes} de 5 (${totalAvaliacoes} avaliações)`}>
            <i className="fa-solid fa-star"></i>
            <span className="text-slate-600 font-semibold">{mediaAvaliacoes}</span>
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {activeBadges.map((badge) => (
        <span
          key={badge.key}
          className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200`}
        >
          <i className={`${badge.icon} ${badge.cor}`}></i>
          <span className="text-slate-700">{badge.label}</span>
        </span>
      ))}
      {!!totalAvaliacoes && totalAvaliacoes > 0 && (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-50 border border-yellow-200">
          <i className="fa-solid fa-star text-yellow-500"></i>
          <span className="text-slate-700">{mediaAvaliacoes} ({totalAvaliacoes})</span>
        </span>
      )}
    </div>
  );
}
