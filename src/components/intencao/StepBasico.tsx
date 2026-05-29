'use client';

import { useMarcasModelos } from '@/hooks/useMarcasModelos';

interface StepBasicoProps {
  criterios: {
    marca: string;
    modelo: string;
    anoMinimo: number;
    anoMaximo?: number;
  };
  onChange: (field: string, value: any) => void;
}

export default function StepBasico({ criterios, onChange }: StepBasicoProps) {
  const { marcas, getModelos } = useMarcasModelos();
  const modelos = criterios.marca ? getModelos(criterios.marca) : [];
  const anoAtual = new Date().getFullYear();

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1">Marca *</label>
        <select
          value={criterios.marca}
          onChange={(e) => { onChange('criterios.marca', e.target.value); onChange('criterios.modelo', ''); }}
          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent"
        >
          <option value="">Selecione a marca</option>
          {marcas.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1">Modelo *</label>
        <select
          value={criterios.modelo}
          onChange={(e) => onChange('criterios.modelo', e.target.value)}
          disabled={!criterios.marca}
          className={`w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent ${!criterios.marca ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}
        >
          <option value="">{criterios.marca ? 'Selecione o modelo' : 'Selecione primeiro a marca'}</option>
          {modelos.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Ano mínimo *</label>
          <select
            value={criterios.anoMinimo || ''}
            onChange={(e) => onChange('criterios.anoMinimo', Number(e.target.value))}
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent"
          >
            <option value="">Mínimo</option>
            {Array.from({ length: anoAtual - 1989 }, (_, i) => anoAtual - i).map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Ano máximo</label>
          <select
            value={criterios.anoMaximo || ''}
            onChange={(e) => onChange('criterios.anoMaximo', e.target.value ? Number(e.target.value) : undefined)}
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent"
          >
            <option value="">Máximo (opcional)</option>
            {Array.from({ length: anoAtual - 1989 }, (_, i) => anoAtual - i).map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
