import { useState } from 'react';
import { CONCELHOS, TIPOS_COMBUSTIVEL, TIPOS_CAMBIO } from '@/lib/constants';
import type { CarroFormData } from '@/types/carro';

interface StepDadosProps {
  dados: CarroFormData;
  setDados: React.Dispatch<React.SetStateAction<CarroFormData>>;
  onNext: () => void;
  onBack: () => void;
}

export default function StepDados({ dados, setDados, onNext, onBack }: StepDadosProps) {
  const [erros, setErros] = useState<Record<string, boolean>>({});

  const atualizar = (campo: string, valor: string) => {
    setDados((prev) => ({ ...prev, [campo]: valor }));
    setErros((prev) => ({ ...prev, [campo]: false }));
  };

  const validar = () => {
    const novosErros: Record<string, boolean> = {};
    if (!dados.marca?.trim()) novosErros.marca = true;
    if (!dados.modelo?.trim()) novosErros.modelo = true;
    if (!dados.anoFabricacao) novosErros.anoFabricacao = true;
    if (!dados.anoModelo) novosErros.anoModelo = true;
    if (!dados.km && dados.km !== '0') novosErros.km = true;
    if (!dados.cor?.trim()) novosErros.cor = true;
    if (!dados.portas) novosErros.portas = true;

    setErros(novosErros);
    if (Object.keys(novosErros).length === 0) {
      onNext();
    }
  };

  const campo = (label: string, campoId: keyof CarroFormData, type = 'text', placeholder = '', options: string[] | null = null) => (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1">
        {label} <span className="text-red-500">*</span>
      </label>
      {options ? (
        <select
          value={dados[campoId] as string || ''}
          onChange={(e) => atualizar(campoId, e.target.value)}
          className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:outline-none focus:border-accent"
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          placeholder={placeholder}
          value={dados[campoId] as string || ''}
          onChange={(e) => atualizar(campoId, e.target.value)}
          className={`w-full border rounded-xl p-2.5 text-sm focus:outline-none focus:border-accent ${
            erros[campoId] ? 'border-red-400' : 'border-gray-300'
          }`}
        />
      )}
      {erros[campoId] && (
        <span className="text-xs text-red-500 mt-1 block">Este campo é obrigatório.</span>
      )}
    </div>
  );

  return (
    <div>
      <h3 className="font-bold text-lg mb-3">📋 Dados do Veículo</h3>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {campo('Marca', 'marca', 'text', 'Ex: Renault')}
        {campo('Modelo', 'modelo', 'text', 'Ex: Clio')}
        {campo('Ano de Fabricação', 'anoFabricacao', 'number', 'Ex: 2007')}
        {campo('Ano Modelo', 'anoModelo', 'number', 'Ex: 2008')}
        {campo('Quilómetros', 'km', 'number', 'Ex: 210000')}
        {campo('Cor', 'cor', 'text', 'Ex: Cinzento')}
        {campo('Combustível', 'combustivel', 'text', '', TIPOS_COMBUSTIVEL)}
        {campo('Câmbio', 'cambio', 'text', '', TIPOS_CAMBIO)}
        {campo('Nº Portas', 'portas', 'number', 'Ex: 5')}
        {campo('Concelho', 'localizacao', 'text', '', CONCELHOS)}
      </div>
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 bg-white hover:bg-slate-50 text-brand-700 font-bold py-3 rounded-xl transition border border-slate-300"
        >
          Voltar
        </button>
        <button
          onClick={validar}
          className="flex-1 bg-accent hover:bg-accent-hover text-white font-bold py-3 rounded-xl transition"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
