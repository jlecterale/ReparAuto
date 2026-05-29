'use client';

import { COMBUSTIVEIS_INTENCAO, TRANSMISSOES_INTENCAO } from '@/lib/constants';

interface StepPrecoCombustivelProps {
  criterios: {
    precoMinimo?: number;
    precoMaximo: number;
    combustivel: string[];
    tipoTransmissao: string[];
  };
  onChange: (field: string, value: any) => void;
}

export default function StepPrecoCombustivel({ criterios, onChange }: StepPrecoCombustivelProps) {
  const toggleArray = (field: string, value: string) => {
    const arr = field === 'combustivel' ? criterios.combustivel : criterios.tipoTransmissao;
    if (value === 'qualquer') {
      onChange(`criterios.${field}`, ['qualquer']);
      return;
    }
    const filtered = arr.filter((v) => v !== 'qualquer');
    const novo = filtered.includes(value) ? filtered.filter((v) => v !== value) : [...filtered, value];
    onChange(`criterios.${field}`, novo.length === 0 ? [] : novo);
  };

  const renderCheckboxes = (field: string, options: string[]) => (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const arr = field === 'combustivel' ? criterios.combustivel : criterios.tipoTransmissao;
        const selected = arr.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggleArray(field, opt)}
            className={`px-3 py-1.5 text-xs font-bold rounded-full border transition ${
              selected ? 'bg-accent text-white border-accent' : 'bg-white text-fg-muted border-slate-300 hover:border-accent'
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-fg-subtle mb-1">Preço mínimo (€)</label>
          <input
            type="number"
            min={0}
            placeholder="0"
            value={criterios.precoMinimo ?? ''}
            onChange={(e) => onChange('criterios.precoMinimo', e.target.value ? Number(e.target.value) : undefined)}
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-fg-subtle mb-1">Preço máximo * (€)</label>
          <input
            type="number"
            min={0}
            placeholder="Ex: 15000"
            value={criterios.precoMaximo || ''}
            onChange={(e) => onChange('criterios.precoMaximo', Number(e.target.value))}
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-fg-subtle mb-2">Combustível *</label>
        {renderCheckboxes('combustivel', COMBUSTIVEIS_INTENCAO)}
      </div>

      <div>
        <label className="block text-xs font-bold text-fg-subtle mb-2">Transmissão *</label>
        {renderCheckboxes('tipoTransmissao', TRANSMISSOES_INTENCAO)}
      </div>
    </div>
  );
}
