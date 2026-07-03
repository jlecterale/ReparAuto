'use client';

import { useState } from 'react';
import { CaretDown } from '@phosphor-icons/react';
import {
  TIPOS_COMBUSTIVEL,
  TIPOS_CAMBIO,
  TIPOS_CARROCERIA,
  CONDICOES_VEICULO,
  TIPOS_TRACAO,
  EQUIPAMENTOS_CARRO,
} from '@/lib/constants';
import { validarDadosVeiculo } from '@/lib/carSpec';
import { toggleInList } from '@/lib/utils';
import { applyCarAudioFieldsToForm } from '@/lib/audioListingForm';
import AudioAdAssistant from '@/components/anunciar/AudioAdAssistant';
import SeletorMarcaModelo from '@/components/ui/SeletorMarcaModelo';
import SeletorLocalizacao from '@/components/ui/SeletorLocalizacao';
import ToggleChip from '@/components/ui/ToggleChip';
import type { CarroFormData } from '@/types/carro';
import Button from '@/components/ui/Button';

interface StepDadosProps {
  dados: CarroFormData;
  setDados: React.Dispatch<React.SetStateAction<CarroFormData>>;
  onNext: () => void;
  onBack: () => void;
}

interface CampoOptions {
  type?: string;
  placeholder?: string;
  options?: readonly string[];
  required?: boolean;
  /** Optional selects get an empty "Indiferente" choice unless the value set is exhaustive (e.g. condition). */
  emptyOption?: boolean;
  /** Hard character cap. On numeric fields this is enforced live (type=number ignores maxLength). */
  maxLength?: number;
}

export default function StepDados({ dados, setDados, onNext, onBack }: StepDadosProps) {
  // Maps a field id to its error message (empty/absent = valid).
  const [erros, setErros] = useState<Record<string, string>>({});
  const [showMore, setShowMore] = useState(false);

  const atualizar = (campo: string, valor: string) => {
    setDados((prev) => ({ ...prev, [campo]: valor }));
    setErros((prev) => ({ ...prev, [campo]: '' }));
  };

  const toggleFeature = (feature: string) => {
    setDados((prev) => ({ ...prev, features: toggleInList(prev.features, feature) }));
  };

  const validar = () => {
    const novosErros = validarDadosVeiculo(dados);
    setErros(novosErros);
    if (Object.keys(novosErros).length === 0) {
      onNext();
    }
  };

  // Validate a single field on blur so range errors surface as soon as the user
  // leaves the field, not only when they press "Continuar".
  const validarCampo = (campoId: string) => {
    const todos = validarDadosVeiculo(dados);
    setErros((prev) => ({ ...prev, [campoId]: todos[campoId] ?? '' }));
  };

  const campo = (
    label: string,
    campoId: keyof CarroFormData,
    { type = 'text', placeholder = '', options, required = true, emptyOption = true, maxLength }: CampoOptions = {},
  ) => {
    const numeric = type === 'number';
    return (
    <div>
      <label className="block text-xs font-semibold text-fg-subtle mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {options ? (
        <select
          value={(dados[campoId] as string) || ''}
          onChange={(e) => atualizar(campoId, e.target.value)}
          className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:outline-none focus:border-accent"
        >
          {!required && emptyOption && <option value="">Indiferente</option>}
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : (
        <input
          // Numeric fields render as a digit-only text input: type=number ignores
          // maxLength, so we cap length here and strip non-digits on input.
          type={numeric ? 'text' : type}
          inputMode={numeric ? 'numeric' : undefined}
          pattern={numeric ? '[0-9]*' : undefined}
          placeholder={placeholder}
          maxLength={maxLength}
          value={(dados[campoId] as string) || ''}
          onChange={(e) =>
            atualizar(campoId, numeric ? e.target.value.replace(/\D/g, '').slice(0, maxLength) : e.target.value)
          }
          onBlur={() => validarCampo(campoId)}
          className={`w-full border rounded-xl p-2.5 text-sm focus:outline-none focus:border-accent ${
            erros[campoId] ? 'border-red-400' : 'border-gray-300'
          }`}
        />
      )}
      {erros[campoId] && (
        <span className="text-xs text-red-500 mt-1 block">{erros[campoId]}</span>
      )}
    </div>
    );
  };

  return (
    <div>
      <h3 className="font-bold text-lg mb-3">📋 Dados do Veículo</h3>
      <AudioAdAssistant
        kind="carro"
        className="mb-4"
        onFields={(fields) => {
          setDados((prev) => applyCarAudioFieldsToForm(prev, fields));
          setErros({});
        }}
      />
      <SeletorMarcaModelo
        marca={dados.marca}
        modelo={dados.modelo}
        onChangeMarca={(m) => {
          atualizar('marca', m);
          atualizar('modelo', '');
        }}
        onChangeModelo={(m) => atualizar('modelo', m)}
        errors={{ marca: !!erros.marca, modelo: !!erros.modelo }}
        className="mb-4"
      />
      <div className="grid grid-cols-2 gap-3 mb-4">
        {campo('Ano de Fabricação', 'anoFabricacao', { type: 'number', placeholder: 'Ex: 2007', maxLength: 4 })}
        {campo('Ano Modelo', 'anoModelo', { type: 'number', placeholder: 'Ex: 2008', maxLength: 4 })}
        {campo('Quilómetros', 'km', { type: 'number', placeholder: 'Ex: 210000', maxLength: 6 })}
        {campo('Cor', 'cor', { placeholder: 'Ex: Cinzento', maxLength: 30 })}
        {campo('Combustível', 'combustivel', { options: TIPOS_COMBUSTIVEL })}
        {campo('Câmbio', 'cambio', { options: TIPOS_CAMBIO })}
        {campo('Nº Portas', 'portas', { type: 'number', placeholder: 'Ex: 5', maxLength: 1 })}
        {campo('Lugares', 'seats', { type: 'number', placeholder: 'Ex: 5', required: false, maxLength: 2 })}
        {campo('Categoria', 'bodyType', { options: TIPOS_CARROCERIA, required: false })}
        {campo('Condição', 'condition', { options: CONDICOES_VEICULO, required: false, emptyOption: false })}
        <div className="col-span-2">
          <SeletorLocalizacao
            distrito={dados.localizacaoDistrito}
            concelho={dados.localizacao}
            onChange={(d, c) => {
              atualizar('localizacaoDistrito', d);
              atualizar('localizacao', c);
            }}
            obrigatorio
          />
        </div>
      </div>

      {/* Advanced specs — collapsed by default to keep the core form short */}
      <button
        type="button"
        onClick={() => setShowMore((v) => !v)}
        className="flex items-center gap-1.5 text-sm font-semibold text-accent mb-3"
        aria-expanded={showMore}
      >
        <CaretDown className={`transition-transform ${showMore ? 'rotate-180' : ''}`} />
        {showMore ? 'Ocultar detalhes adicionais' : 'Adicionar mais detalhes (opcional)'}
      </button>

      {showMore && (
        <div className="mb-4 space-y-4 border-t border-slate-100 pt-4">
          <div className="grid grid-cols-2 gap-3">
            {campo('Potência (cv)', 'power', { type: 'number', placeholder: 'Ex: 90', required: false, maxLength: 4 })}
            {campo('Cilindrada (cc)', 'displacement', { type: 'number', placeholder: 'Ex: 1500', required: false, maxLength: 5 })}
            {campo('Tração', 'traction', { options: TIPOS_TRACAO, required: false })}
          </div>
          <div>
            <label className="block text-xs font-semibold text-fg-subtle mb-2">Equipamento / Extras</label>
            <div className="flex flex-wrap gap-2">
              {EQUIPAMENTOS_CARRO.map((feature) => (
                <ToggleChip
                  key={feature}
                  active={dados.features.includes(feature)}
                  onClick={() => toggleFeature(feature)}
                >
                  {feature}
                </ToggleChip>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          tipo="secundario"
          tamanho="lg"
          onClick={onBack}
          className="flex-1"
        >
          Voltar
        </Button>
        <Button
          tipo="primario"
          tamanho="lg"
          onClick={validar}
          className="flex-1"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}
