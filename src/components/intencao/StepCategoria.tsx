'use client';

import { CATEGORIAS_INTENCAO } from '@/lib/constants';
import type { CategoriaIntencao } from '@/types/intencao';

export default function StepCategoria({
  value,
  onChange,
}: {
  value: CategoriaIntencao | null;
  onChange: (cat: CategoriaIntencao) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {CATEGORIAS_INTENCAO.map((cat) => {
        const selected = value === cat.value;
        return (
          <button
            key={cat.value}
            type="button"
            onClick={() => onChange(cat.value)}
            className={`flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 text-sm font-bold transition-all duration-200 cursor-pointer ${
              selected
                ? 'border-accent bg-accent/5 text-accent ring-4 ring-accent/20'
                : 'border-slate-200 bg-white text-fg-muted hover:border-accent/50 hover:text-fg-heading'
            }`}
          >
            <span className="text-3xl">{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
}
