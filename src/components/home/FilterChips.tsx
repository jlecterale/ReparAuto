'use client';

import { useApp } from '@/providers/AppProvider';

const chips = [
  { label: 'Destaques Low-Cost', value: 'lowcost' },
  { label: 'Até 500€', value: '500' },
  { label: 'Até 1.000€', value: '1000' },
  { label: 'Qualquer Valor', value: 'qualquer' },
];

export default function FilterChips() {
  const { carros } = useApp();
  const { filtroAtivo, setFiltroAtivo } = carros;

  return (
    <div className="flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide pb-1">
      {chips.map((chip) => (
        <button
          key={chip.value}
          onClick={() => setFiltroAtivo(filtroAtivo === chip.value ? null : chip.value as 'lowcost' | '500' | '1000' | 'reparar' | 'qualquer')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition flex-shrink-0 ${
            filtroAtivo === chip.value
              ? 'bg-accent text-white border-accent'
              : 'bg-white text-fg border-slate-200 hover:bg-slate-50'
          }`}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}
