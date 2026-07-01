'use client';

import SeletorMarcaModelo from '@/components/ui/SeletorMarcaModelo';
import type { CategoriaIntencao } from '@/types/intencao';
import type { TipoVeiculo } from '@/types/marcas-modelos';

interface StepBasicoProps {
  criterios: {
    marca: string;
    modelo: string;
    anoMinimo: number;
    anoMaximo?: number;
  };
  onChange: (field: string, value: any) => void;
  /** Categoria da intenção para filtrar marcas */
  categoria?: CategoriaIntencao | null;
}

const CATEGORIA_PARA_TIPO: Record<string, TipoVeiculo> = {
  carro: 'carro',
  moto: 'moto',
  viatura_comercial: 'caminhao',
};

export default function StepBasico({ criterios, onChange, categoria }: StepBasicoProps) {
  const tipo = categoria ? CATEGORIA_PARA_TIPO[categoria] : undefined;
  const anoAtual = new Date().getFullYear();

  return (
    <div className="space-y-4">
      <SeletorMarcaModelo
        tipo={tipo}
        marca={criterios.marca}
        modelo={criterios.modelo}
        onChangeMarca={(m) => { onChange('criterios.marca', m); onChange('criterios.modelo', ''); }}
        onChangeModelo={(m) => onChange('criterios.modelo', m)}
        labelMarca="Marca"
        labelModelo="Modelo"
        placeholderMarca="Selecione a marca"
        placeholderModelo="Selecione o modelo"
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-fg mb-1.5">Ano mínimo <span className="text-accent">*</span></label>
          <select
            value={criterios.anoMinimo || ''}
            onChange={(e) => onChange('criterios.anoMinimo', Number(e.target.value))}
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-fg focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition cursor-pointer"
          >
            <option value="">Mínimo</option>
            {Array.from({ length: anoAtual - 1989 }, (_, i) => anoAtual - i).map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-fg mb-1.5">Ano máximo</label>
          <select
            value={criterios.anoMaximo || ''}
            onChange={(e) => onChange('criterios.anoMaximo', e.target.value ? Number(e.target.value) : undefined)}
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-fg focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition cursor-pointer"
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
