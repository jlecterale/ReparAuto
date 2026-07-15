'use client';

import { useMemo } from 'react';
import marcasModelos from '@/data/marcas-modelos.json';

interface MarcaModelo {
  marca: string;
  modelos: string[];
}

interface Props {
  marca: string;
  modelo: string;
  onMarcaChange: (marca: string) => void;
  onModeloChange: (modelo: string) => void;
  marcaLabel?: string;
  modeloLabel?: string;
  marcaPlaceholder?: string;
  modeloPlaceholder?: string;
  required?: boolean;
}

export default function BrandModelSelect({
  marca,
  modelo,
  onMarcaChange,
  onModeloChange,
  marcaLabel = 'Marca',
  modeloLabel = 'Modelo',
  marcaPlaceholder = 'Selecionar marca',
  modeloPlaceholder = 'Selecionar modelo',
  required,
}: Props) {
  const lista = marcasModelos as MarcaModelo[];
  const marcas = useMemo(() => lista.map((m) => m.marca).sort(), [lista]);
  const modelos = useMemo(
    () => lista.find((m) => m.marca === marca)?.modelos ?? [],
    [lista, marca],
  );

  return (
    <>
      <div>
        <label htmlFor="brand-select" className="block text-xs font-bold text-fg mb-1">
          {marcaLabel}
        </label>
        <select
          id="brand-select"
          value={marca}
          required={required}
          onChange={(e) => {
            onMarcaChange(e.target.value);
            onModeloChange('');
          }}
          className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
        >
          <option value="">{marcaPlaceholder}</option>
          {marcas.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="model-select" className="block text-xs font-bold text-fg mb-1">
          {modeloLabel}
        </label>
        <select
          id="model-select"
          value={modelo}
          disabled={!marca}
          required={required}
          onChange={(e) => onModeloChange(e.target.value)}
          className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 disabled:bg-neutral-50 disabled:text-fg-subtle disabled:cursor-not-allowed"
        >
          <option value="">{modeloPlaceholder}</option>
          {modelos.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
