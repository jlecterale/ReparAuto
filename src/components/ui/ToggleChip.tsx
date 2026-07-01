'use client';

interface ToggleChipProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  tamanho?: 'sm' | 'md';
}

/** Pill-shaped multi-select toggle used by equipment/extras pickers and filters. */
export default function ToggleChip({ active, onClick, children, tamanho = 'md' }: ToggleChipProps) {
  const tamanhos = {
    sm: 'px-2.5 py-1 text-[11px]',
    md: 'px-3 py-1.5 text-xs',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full font-semibold border transition ${tamanhos[tamanho]} ${
        active
          ? 'bg-accent text-white border-accent'
          : 'bg-slate-50 text-fg-muted border-slate-200 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  );
}
