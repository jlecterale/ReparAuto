'use client';

import { useMemo, useState } from 'react';
import { useMarcasModelos } from '@/hooks/useMarcasModelos';
import { formatCompatibilityEntry } from '@/lib/compatibility';
import type { CompatibilityEntry } from '@/types/peca';

interface Props {
  value: CompatibilityEntry[];
  onChange: (entries: CompatibilityEntry[]) => void;
  required?: boolean;
  maxEntries?: number;
}

const currentYear = new Date().getFullYear();

const emptyDraft: CompatibilityEntry = {
  marca: '',
  modelo: '',
  anoInicio: undefined,
  anoFim: undefined,
  motor: '',
};

export default function CompatibilitySelector({ value, onChange, required, maxEntries = 20 }: Props) {
  const { marcas, getModelos } = useMarcasModelos();
  const [draft, setDraft] = useState<CompatibilityEntry>(emptyDraft);
  const [erro, setErro] = useState('');

  const modelos = useMemo(
    () => (draft.marca ? getModelos(draft.marca) : []),
    [draft.marca, getModelos],
  );

  const update = (field: keyof CompatibilityEntry, val: string) => {
    setErro('');
    setDraft((prev) => {
      if (field === 'anoInicio' || field === 'anoFim') {
        const num = val ? Number(val) : undefined;
        return { ...prev, [field]: Number.isFinite(num) ? num : undefined };
      }
      if (field === 'marca') {
        return { ...prev, marca: val, modelo: '' };
      }
      return { ...prev, [field]: val };
    });
  };

  const add = () => {
    if (!draft.marca.trim()) {
      setErro('Selecione uma marca.');
      return;
    }
    if (draft.anoInicio && draft.anoFim && draft.anoInicio > draft.anoFim) {
      setErro('Ano inicial não pode ser maior que ano final.');
      return;
    }
    if (value.length >= maxEntries) {
      setErro(`Máximo ${maxEntries} compatibilidades.`);
      return;
    }
    const entry: CompatibilityEntry = {
      marca: draft.marca.trim(),
      modelo: draft.modelo?.trim() || undefined,
      anoInicio: draft.anoInicio,
      anoFim: draft.anoFim,
      motor: draft.motor?.trim() || undefined,
    };
    onChange([...value, entry]);
    setDraft(emptyDraft);
  };

  const remove = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold text-slate-500">
        Compatibilidades {required && <span className="text-red-500">*</span>}
      </label>

      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {value.map((entry, i) => (
            <li
              key={`${entry.marca}-${i}`}
              className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-full pl-3 pr-1 py-1 text-xs font-semibold text-brand-800"
            >
              <i className="fa-solid fa-car-side text-accent"></i>
              <span>{formatCompatibilityEntry(entry)}</span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="w-5 h-5 inline-flex items-center justify-center rounded-full hover:bg-orange-100 text-slate-500 hover:text-red-500 transition"
                aria-label="Remover compatibilidade"
              >
                <i className="fa-solid fa-xmark text-[10px]"></i>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Marca</label>
          <input
            type="text"
            list="compat-marcas"
            value={draft.marca}
            onChange={(e) => update('marca', e.target.value)}
            placeholder="Ex: BMW"
            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:border-accent"
          />
          <datalist id="compat-marcas">
            {marcas.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Modelo (opcional)</label>
          <input
            type="text"
            list="compat-modelos"
            value={draft.modelo}
            onChange={(e) => update('modelo', e.target.value)}
            placeholder="Ex: Série 3 E90"
            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:border-accent"
          />
          <datalist id="compat-modelos">
            {modelos.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Ano início</label>
          <input
            type="number"
            min={1950}
            max={currentYear + 1}
            value={draft.anoInicio ?? ''}
            onChange={(e) => update('anoInicio', e.target.value)}
            placeholder="Ex: 2005"
            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Ano fim</label>
          <input
            type="number"
            min={1950}
            max={currentYear + 1}
            value={draft.anoFim ?? ''}
            onChange={(e) => update('anoFim', e.target.value)}
            placeholder="Ex: 2012"
            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:border-accent"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Motor (opcional)</label>
          <input
            type="text"
            value={draft.motor}
            onChange={(e) => update('motor', e.target.value)}
            placeholder="Ex: 2.0 TDI 140cv, N47, etc."
            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:border-accent"
          />
        </div>
        <div className="sm:col-span-2 flex items-center justify-between gap-2">
          {erro ? (
            <p className="text-xs text-red-500 font-semibold" role="alert" aria-live="polite">{erro}</p>
          ) : (
            <p className="text-[11px] text-slate-500">
              Adicione todas as marcas/modelos onde a peça encaixa.
            </p>
          )}
          <button
            type="button"
            onClick={add}
            className="bg-accent hover:bg-accent-hover text-white text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1"
          >
            <i className="fa-solid fa-plus"></i> Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}
