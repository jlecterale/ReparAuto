'use client';

import { useDistritosConcelhos } from '@/hooks/useDistritosConcelhos';

interface StepLocalizacaoProps {
  criterios: {
    localizacao: {
      distrito: string;
      raio: number;
    };
    quilometragemMaxima: number;
  };
  onChange: (field: string, value: any) => void;
}

export default function StepLocalizacao({ criterios, onChange }: StepLocalizacaoProps) {
  const { distritos } = useDistritosConcelhos();

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-fg-subtle mb-1">Distrito *</label>
        <select
          value={criterios.localizacao.distrito}
          onChange={(e) => onChange('criterios.localizacao.distrito', e.target.value)}
          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent"
        >
          <option value="">Selecione o distrito</option>
          {distritos.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-fg-subtle mb-1">
          Raio de busca (km) * <span className="font-normal text-fg-subtle">— 0 = apenas este distrito</span>
        </label>
        <input
          type="range"
          min={0}
          max={200}
          step={10}
          value={criterios.localizacao.raio}
          onChange={(e) => onChange('criterios.localizacao.raio', Number(e.target.value))}
          className="w-full accent-accent"
        />
        <div className="flex justify-between text-xs text-fg-subtle mt-1">
          <span>0 km</span>
          <span className="font-bold text-accent">{criterios.localizacao.raio} km</span>
          <span>200 km</span>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-fg-subtle mb-1">Quilometragem máxima (km) *</label>
        <input
          type="number"
          min={0}
          step={10000}
          placeholder="Ex: 150000"
          value={criterios.quilometragemMaxima || ''}
          onChange={(e) => onChange('criterios.quilometragemMaxima', Number(e.target.value))}
          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent"
        />
      </div>
    </div>
  );
}
