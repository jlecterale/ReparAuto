import type { ReviewCriterio } from '@/types/review';

interface ReviewCriteriosBarProps {
  criterios: ReviewCriterio[];
  /** Show compact horizontal layout (default) or vertical list */
  layout?: 'horizontal' | 'vertical';
}

const STAR_COLORS = ['text-red-500', 'text-orange-500', 'text-yellow-500', 'text-lime-500', 'text-green-500'];

function StarIcon({ filled, index }: { filled: boolean; index: number }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`w-3 h-3 ${filled ? STAR_COLORS[index] ?? 'text-yellow-500' : 'text-slate-200'}`}
      fill="currentColor"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

export default function ReviewCriteriosBar({
  criterios,
  layout = 'horizontal',
}: ReviewCriteriosBarProps) {
  if (!criterios || criterios.length === 0) return null;

  if (layout === 'vertical') {
    return (
      <div className="space-y-1.5 mt-2">
        {criterios.map((c) => (
          <div key={c.chave} className="flex items-center justify-between text-xs">
            <span className="text-fg-subtle truncate mr-2">{c.rotulo}</span>
            <div className="flex items-center gap-0.5 shrink-0">
              {[0, 1, 2, 3, 4].map((i) => (
                <StarIcon key={i} filled={i < c.nota} index={Math.max(0, Math.min(4, Math.round(c.nota) - 1))} />
              ))}
              <span className="ml-1 font-semibold text-fg-subtle w-4 text-right">
                {c.nota}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Horizontal: show each criterion as a compact badge with stars
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {criterios.map((c) => (
        <div
          key={c.chave}
          className="inline-flex items-center gap-1 bg-slate-50 rounded-full px-2.5 py-1 border border-slate-200"
        >
          <span className="text-[10px] text-fg-subtle leading-tight truncate max-w-24">
            {c.rotulo}
          </span>
          <div className="flex items-center gap-[1px]">
            {[0, 1, 2, 3, 4].map((i) => (
              <StarIcon key={i} filled={i < c.nota} index={Math.max(0, Math.min(4, Math.round(c.nota) - 1))} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
