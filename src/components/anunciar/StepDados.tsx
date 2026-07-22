'use client';

import { useState } from 'react';
import { CaretDown } from '@phosphor-icons/react';
import {
  TIPOS_COMBUSTIVEL,
  TIPOS_CAMBIO,
  TIPOS_CARROCERIA,
  CONDICOES_VEICULO,
  TIPOS_TRACAO,
  MESES,
  ORIGENS_VEICULO,
  getTiposEstofo,
  getEquipamentosCarro,
  bodyTypeLabel,
  equipmentLabel,
} from '@/lib/constants';
import { validarDadosVeiculo } from '@/lib/carSpec';
import { toggleInList, sanitizeDecimalInput } from '@/lib/utils';
import SeletorMarcaModelo from '@/components/ui/SeletorMarcaModelo';
import SeletorLocalizacao from '@/components/ui/SeletorLocalizacao';
import ToggleChip from '@/components/ui/ToggleChip';
import { useCountry } from '@/providers/CountryProvider';
import { term } from '@/lib/terms';
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
  /** Decimal numeric field (e.g. l/100 km): allows digits + a single separator. */
  decimal?: boolean;
  /** Display label for a stored option value (market vocabulary); value stays canonical. */
  optionLabel?: (value: string) => string;
}

export default function StepDados({ dados, setDados, onNext, onBack }: StepDadosProps) {
  // Maps a field id to its error message (empty/absent = valid).
  const [erros, setErros] = useState<Record<string, string>>({});
  const [showMore, setShowMore] = useState(false);
  const { country } = useCountry();

  const atualizar = (campo: string, valor: string) => {
    setDados((prev) => ({ ...prev, [campo]: valor }));
    setErros((prev) => ({ ...prev, [campo]: '' }));
  };

  const toggleFeature = (feature: string) => {
    setDados((prev) => ({ ...prev, features: toggleInList(prev.features, feature) }));
  };

  const toggleBoolean = (campo: 'acceptsFinancing' | 'vatDeductible' | 'acceptsExchange') => {
    setDados((prev) => ({ ...prev, [campo]: !prev[campo] }));
  };

  const validar = () => {
    const novosErros = validarDadosVeiculo(dados, country);
    setErros(novosErros);
    if (Object.keys(novosErros).length === 0) {
      onNext();
    }
  };

  // Validate a single field on blur so range errors surface as soon as the user
  // leaves the field, not only when they press "Continuar".
  const validarCampo = (campoId: string) => {
    const todos = validarDadosVeiculo(dados, country);
    setErros((prev) => ({ ...prev, [campoId]: todos[campoId] ?? '' }));
  };

  const campo = (
    label: string,
    campoId: keyof CarroFormData,
    { type = 'text', placeholder = '', options, required = true, emptyOption = true, maxLength, decimal = false, optionLabel }: CampoOptions = {},
  ) => {
    const numeric = type === 'number' || decimal;
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
            <option key={opt} value={opt}>{optionLabel ? optionLabel(opt) : opt}</option>
          ))}
        </select>
      ) : (
        <input
          // Numeric fields render as a digit-only text input: type=number ignores
          // maxLength, so we cap length here and strip non-digits on input.
          type={numeric ? 'text' : type}
          inputMode={decimal ? 'decimal' : numeric ? 'numeric' : undefined}
          pattern={decimal ? '[0-9.,]*' : numeric ? '[0-9]*' : undefined}
          placeholder={placeholder}
          maxLength={maxLength}
          value={(dados[campoId] as string) || ''}
          onChange={(e) =>
            atualizar(
              campoId,
              decimal
                ? sanitizeDecimalInput(e.target.value).slice(0, maxLength)
                : numeric
                  ? e.target.value.replace(/\D/g, '').slice(0, maxLength)
                  : e.target.value,
            )
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
        <div className="col-span-2">
          {campo('Versão', 'version', { placeholder: 'Ex: CDi Avantgarde', required: false, maxLength: 60 })}
        </div>
        {campo('Ano de Fabricação', 'anoFabricacao', { type: 'number', placeholder: 'Ex: 2007', maxLength: 4 })}
        {campo('Ano Modelo', 'anoModelo', { type: 'number', placeholder: 'Ex: 2008', maxLength: 4 })}
        {campo(term('mileageLabel', country), 'km', { type: 'number', placeholder: 'Ex: 210000', maxLength: 6 })}
        {campo('Cor', 'cor', { placeholder: 'Ex: Cinzento', maxLength: 30 })}
        {campo('Combustível', 'combustivel', { options: TIPOS_COMBUSTIVEL })}
        {campo('Câmbio', 'cambio', { options: TIPOS_CAMBIO })}
        {campo('Nº Portas', 'portas', { type: 'number', placeholder: 'Ex: 5', maxLength: 1 })}
        {campo('Lugares', 'seats', { type: 'number', placeholder: 'Ex: 5', required: false, maxLength: 2 })}
        {campo('Categoria', 'bodyType', { options: TIPOS_CARROCERIA, required: false, optionLabel: (v) => bodyTypeLabel(v, country) })}
        {campo('Condição', 'condition', { options: CONDICOES_VEICULO, required: false, emptyOption: false })}
        <div className="col-span-2">
          <SeletorLocalizacao
            distrito={dados.localizacaoDistrito}
            concelho={dados.localizacao}
            onChange={(d, c) => {
              atualizar('localizacaoDistrito', d);
              atualizar('localizacao', c);
              atualizar('bairro', '');
            }}
            obrigatorio
          />
        </div>
        {country === 'BR' && (
          <div className="col-span-2">
            {campo('Bairro', 'bairro', { placeholder: 'Ex: Bela Vista', required: false, maxLength: 60 })}
          </div>
        )}
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
            {campo(`Nº de ${term('gearsLabel', country).toLowerCase()}`, 'gears', { type: 'number', placeholder: 'Ex: 6', required: false, maxLength: 2 })}
            {/* Month of first registration — stored as 1–12, labelled by month name. */}
            <div>
              <label className="block text-xs font-semibold text-fg-subtle mb-1">{term('firstRegistrationLabel', country)}</label>
              <select
                value={dados.firstRegistrationMonth || ''}
                onChange={(e) => atualizar('firstRegistrationMonth', e.target.value)}
                className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:outline-none focus:border-accent"
              >
                <option value="">Indiferente</option>
                {MESES.map((nome, i) => (
                  <option key={nome} value={String(i + 1)}>{nome}</option>
                ))}
              </select>
            </div>
            {campo('Origem', 'origin', { options: ORIGENS_VEICULO, required: false })}
            {campo('Proprietários anteriores', 'previousOwners', { type: 'number', placeholder: 'Ex: 1', required: false, maxLength: 2 })}
            {campo('Garantia (meses)', 'warrantyMonths', { type: 'number', placeholder: 'Ex: 12', required: false, maxLength: 3 })}
            {campo('Emissões CO₂ (g/km)', 'co2Emissions', { type: 'number', placeholder: 'Ex: 120', required: false, maxLength: 3 })}
            {campo('Autonomia (km)', 'maxFuelRange', { type: 'number', placeholder: 'Ex: 900', required: false, maxLength: 4 })}
            {campo(term('upholsteryLabel', country), 'upholstery', { options: getTiposEstofo(country), required: false })}
            {campo('Nº de airbags', 'numberOfAirbags', { type: 'number', placeholder: 'Ex: 8', required: false, maxLength: 2 })}
          </div>

          {/* Fuel consumption (l/100 km) — decimals allowed. */}
          <div>
            <label className="block text-xs font-semibold text-fg-subtle mb-2">Consumo (l/100 km)</label>
            <div className="grid grid-cols-3 gap-3">
              {campo('Urbano', 'consumptionUrban', { decimal: true, placeholder: 'Ex: 7,2', required: false, maxLength: 5 })}
              {campo('Extra-urbano', 'consumptionExtraUrban', { decimal: true, placeholder: 'Ex: 4,8', required: false, maxLength: 5 })}
              {campo('Combinado', 'consumptionCombined', { decimal: true, placeholder: 'Ex: 5,6', required: false, maxLength: 5 })}
            </div>
          </div>

          {/* Commercial conditions (Standvirtual accept_funding / tax_deductible / accept_returns). */}
          <div>
            <label className="block text-xs font-semibold text-fg-subtle mb-2">Condições comerciais</label>
            <div className="flex flex-wrap gap-2">
              <ToggleChip active={dados.acceptsFinancing} onClick={() => toggleBoolean('acceptsFinancing')}>
                Aceita financiamento
              </ToggleChip>
              {country === 'PT' && (
                <ToggleChip active={dados.vatDeductible} onClick={() => toggleBoolean('vatDeductible')}>
                  IVA dedutível
                </ToggleChip>
              )}
              <ToggleChip active={dados.acceptsExchange} onClick={() => toggleBoolean('acceptsExchange')}>
                {term('exchangeLabel', country)}
              </ToggleChip>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-fg-subtle mb-2">Equipamento / Extras</label>
            <div className="flex flex-wrap gap-2">
              {getEquipamentosCarro(country).map((feature) => (
                <ToggleChip
                  key={feature}
                  active={dados.features.includes(feature)}
                  onClick={() => toggleFeature(feature)}
                >
                  {equipmentLabel(feature, country)}
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
