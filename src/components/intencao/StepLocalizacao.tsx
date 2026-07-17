'use client';

import dynamic from 'next/dynamic';
import { useDistritosConcelhos } from '@/hooks/useDistritosConcelhos';
import { useCountry } from '@/providers/CountryProvider';
import { term } from '@/lib/terms';

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
  const { country } = useCountry();
  const regionLabel = term('districtLabel', country);
  // The stored sentinel value stays `todo_portugal` in both markets (it means
  // "whole country" in the matching logic); only the visible label localizes.
  const isWholeCountry = criterios.localizacao.distrito === 'todo_portugal';
  const countryFlag = country === 'BR' ? '🇧🇷' : '🇵🇹';
  const countryName = country === 'BR' ? 'Todo o Brasil' : 'Todo Portugal';

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-fg-subtle mb-1">{regionLabel} *</label>
        <select
          value={criterios.localizacao.distrito}
          onChange={(e) => onChange('criterios.localizacao.distrito', e.target.value)}
          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent"
        >
          <option value="">Selecione o {regionLabel.toLowerCase()}</option>
          <option value="todo_portugal">{countryFlag} {countryName}</option>
          {distritos.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {isWholeCountry ? (
        <div className="bg-slate-50 rounded-xl p-4 text-center text-sm text-fg-subtle">
          <p className="font-semibold text-fg-heading mb-1">{countryFlag} Pesquisa em todo o território nacional</p>
          <p>Serão mostrados resultados de qualquer {regionLabel.toLowerCase()}.</p>
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
        <p className="text-xs text-fg-subtle italic">Selecione um {regionLabel.toLowerCase()} para ver o mapa.</p>
      )}
    </div>
  );
}
