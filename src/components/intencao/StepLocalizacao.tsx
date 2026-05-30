'use client';

import dynamic from 'next/dynamic';
import { useDistritosConcelhos } from '@/hooks/useDistritosConcelhos';

const MapaRaio = dynamic(() => import('./MapaRaio'), { ssr: false });

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
  const isTodoPortugal = criterios.localizacao.distrito === 'todo_portugal';

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
          <option value="todo_portugal">🇵🇹 Todo Portugal</option>
          {distritos.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {isTodoPortugal ? (
        <div className="bg-slate-50 rounded-xl p-4 text-center text-sm text-fg-subtle">
          <p className="font-semibold text-fg-heading mb-1">🇵🇹 Pesquisa em todo o território nacional</p>
          <p>Serão mostrados resultados de qualquer distrito.</p>
        </div>
      ) : criterios.localizacao.distrito ? (
        <>
          <MapaRaio
            distrito={criterios.localizacao.distrito}
            raio={criterios.localizacao.raio}
            onChange={onChange}
          />

          <div>
            <label className="block text-xs font-bold text-fg-subtle mb-1">
              Quilometragem máxima do veículo (km) *
            </label>
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
        </>
      ) : (
        <p className="text-xs text-fg-subtle italic">Selecione um distrito para ver o mapa.</p>
      )}
    </div>
  );
}
