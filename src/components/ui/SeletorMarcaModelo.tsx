'use client';

import { useMemo } from 'react';
import { useMarcasModelos } from '@/hooks/useMarcasModelos';
import type { TipoVeiculo } from '@/types/marcas-modelos';

interface SeletorMarcaModeloProps {
  /** Tipo de veículo para filtrar marcas (opcional) */
  tipo?: TipoVeiculo;
  /** Marca selecionada */
  marca: string;
  /** Modelo selecionado */
  modelo: string;
  /** Callback quando a marca muda */
  onChangeMarca: (marca: string) => void;
  /** Callback quando o modelo muda */
  onChangeModelo: (modelo: string) => void;
  /** Erros de validação */
  errors?: { marca?: boolean; modelo?: boolean };
  /** Label customizada para marca (default: "Marca") */
  labelMarca?: string;
  /** Label customizada para modelo (default: "Modelo") */
  labelModelo?: string;
  /** Placeholder para marca (default: "Selecionar marca") */
  placeholderMarca?: string;
  /** Placeholder para modelo (default: "Selecionar modelo") */
  placeholderModelo?: string;
  /** Se o campo modelo é obrigatório */
  modeloObrigatorio?: boolean;
  /** Classes adicionais */
  className?: string;
}

export default function SeletorMarcaModelo({
  tipo,
  marca,
  modelo,
  onChangeMarca,
  onChangeModelo,
  errors,
  labelMarca = 'Marca',
  labelModelo = 'Modelo',
  placeholderMarca = 'Selecionar marca',
  placeholderModelo = 'Selecionar modelo',
  modeloObrigatorio = true,
  className = '',
}: SeletorMarcaModeloProps) {
  const { marcas, getModelos, loading } = useMarcasModelos({ tipo });

  const modelosDisponiveis = useMemo(
    () => (marca ? getModelos(marca) : []),
    [marca, getModelos]
  );

  return (
    <div className={`grid grid-cols-2 gap-3 ${className}`}>
      <div>
        <label className="block text-xs font-semibold text-fg-subtle mb-1">
          {labelMarca} <span className="text-red-500">*</span>
        </label>
        {loading ? (
          <div className="w-full h-[42px] bg-gray-100 rounded-xl animate-pulse" />
        ) : (
          <select
            value={marca}
            onChange={(e) => {
              onChangeMarca(e.target.value);
              onChangeModelo('');
            }}
            className={`w-full border rounded-xl p-2.5 text-sm focus:outline-none focus:border-accent ${
              errors?.marca ? 'border-red-400' : 'border-gray-300'
            }`}
          >
            <option value="">{placeholderMarca}</option>
            {marcas.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        )}
        {errors?.marca && (
          <span className="text-xs text-red-500 mt-1 block">Este campo é obrigatório.</span>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-fg-subtle mb-1">
          {labelModelo} {modeloObrigatorio && <span className="text-red-500">*</span>}
        </label>
        {loading ? (
          <div className="w-full h-[42px] bg-gray-100 rounded-xl animate-pulse" />
        ) : (
          <select
            value={modelo}
            onChange={(e) => onChangeModelo(e.target.value)}
            disabled={!marca}
            className={`w-full border rounded-xl p-2.5 text-sm focus:outline-none focus:border-accent ${
              errors?.modelo ? 'border-red-400' : 'border-gray-300'
            } ${!marca ? 'bg-gray-50 text-gray-400' : ''}`}
          >
            <option value="">
              {marca ? placeholderModelo : 'Selecione uma marca primeiro'}
            </option>
            {modelosDisponiveis.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        )}
        {errors?.modelo && (
          <span className="text-xs text-red-500 mt-1 block">Este campo é obrigatório.</span>
        )}
      </div>
    </div>
  );
}
