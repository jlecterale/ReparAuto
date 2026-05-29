'use client';

import { CORES_INTENCAO, CARROCERIAS_INTENCAO, ITENS_SERIE } from '@/lib/constants';

interface StepPreferenciasProps {
  preferencias: {
    cores?: string[];
    tipoCarroceria?: string[];
    itensDesejados?: string[];
    aceitaFinanciamento?: boolean;
    aceitaTroca?: boolean;
  };
  onChange: (field: string, value: any) => void;
}

function MultiToggle({ label, options, selected, onChange }: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (vals: string[]) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-fg-subtle mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const on = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(on ? selected.filter((v) => v !== opt) : [...selected, opt])}
              className={`px-3 py-1.5 text-xs font-bold rounded-full border transition ${
                on ? 'bg-accent text-white border-accent' : 'bg-white text-fg-muted border-slate-300 hover:border-accent'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function StepPreferencias({ preferencias, onChange }: StepPreferenciasProps) {
  const p = preferencias || {};

  return (
    <div className="space-y-4">
      <MultiToggle
        label="Cores preferidas"
        options={CORES_INTENCAO}
        selected={p.cores || []}
        onChange={(v) => onChange('preferencias.cores', v)}
      />

      <MultiToggle
        label="Tipo de carroceria"
        options={CARROCERIAS_INTENCAO}
        selected={p.tipoCarroceria || []}
        onChange={(v) => onChange('preferencias.tipoCarroceria', v)}
      />

      <MultiToggle
        label="Itens desejados"
        options={ITENS_SERIE}
        selected={p.itensDesejados || []}
        onChange={(v) => onChange('preferencias.itensDesejados', v)}
      />

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={p.aceitaFinanciamento || false}
            onChange={(e) => onChange('preferencias.aceitaFinanciamento', e.target.checked)}
            className="rounded text-accent focus:ring-accent"
          />
          Aceita financiamento
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={p.aceitaTroca || false}
            onChange={(e) => onChange('preferencias.aceitaTroca', e.target.checked)}
            className="rounded text-accent focus:ring-accent"
          />
          Aceita troca
        </label>
      </div>
    </div>
  );
}
