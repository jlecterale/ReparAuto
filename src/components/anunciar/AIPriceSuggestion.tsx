'use client';

import { Sparkle } from '@phosphor-icons/react';
import useAIPriceSuggestion from '@/hooks/useAIPriceSuggestion';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatarPreco, parsePositiveInt } from '@/lib/utils';
import type { CarroFormData } from '@/types/carro';
import type { AIPriceSuggestionRequest } from '@/types/ia';

interface AIPriceSuggestionProps {
  dados: CarroFormData;
  uid?: string;
  onUsePrice: (price: number) => void;
}

function buildRequest(dados: CarroFormData): AIPriceSuggestionRequest {
  return {
    marca: dados.marca.trim(),
    modelo: dados.modelo.trim(),
    anoFabricacao: Number(dados.anoFabricacao),
    anoModelo: parsePositiveInt(dados.anoModelo) ?? undefined,
    km: parsePositiveInt(dados.km) ?? undefined,
    combustivel: dados.combustivel,
    cambio: dados.cambio,
    condition: dados.condition || undefined,
    power: parsePositiveInt(dados.power) ?? undefined,
    features: dados.features.length ? dados.features : undefined,
    local: dados.localizacao || undefined,
    estadoVeiculo: dados.estadoVeiculo,
    tiposManutencao: dados.tiposManutencao.length ? dados.tiposManutencao : undefined,
    rodando: dados.rodando !== 'nao',
    inspecao: dados.inspecao !== 'nao',
    preco: parsePositiveInt(dados.preco) ?? undefined,
  };
}

/**
 * Market-anchored AI price suggestion widget for the price step.
 * Shows min / recommended / max plus the model's reasoning, with a one-tap
 * "Usar este preço" action.
 */
export default function AIPriceSuggestion({ dados, uid, onUsePrice }: AIPriceSuggestionProps) {
  const { suggest, suggestion, loading, error, remaining } = useAIPriceSuggestion(uid);

  const ready = Boolean(dados.marca.trim() && dados.modelo.trim() && dados.anoFabricacao);
  const exhausted = remaining === 0;

  return (
    <div className="mt-2">
      <Button
        tipo="secundario"
        tamanho="sm"
        icone={<Sparkle weight="fill" className="text-accent" />}
        onClick={() => suggest(buildRequest(dados))}
        disabled={!ready || exhausted}
        carregando={loading}
      >
        {loading ? 'A analisar o mercado…' : 'Sugerir preço com IA'}
      </Button>
      {exhausted && (
        <p className="text-[11px] text-warning-600 mt-1">
          Limite semanal de gerações com IA atingido.
        </p>
      )}
      {error && <p className="text-xs text-danger-600 mt-1">{error}</p>}

      {suggestion && (
        <div className="mt-3 bg-primary-50 border border-primary-200 rounded-xl p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-sm font-bold text-fg-heading">Sugestão de preço</span>
            <Badge cor="blue" variante="soft">Assistido por IA</Badge>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center mb-3">
            <div className="bg-white rounded-lg p-2 border border-primary-100">
              <span className="block text-[10px] uppercase tracking-wide text-fg-subtle">Mínimo</span>
              <span className="block text-sm font-bold text-fg">{formatarPreco(suggestion.priceMin)}</span>
            </div>
            <div className="bg-white rounded-lg p-2 border-2 border-accent">
              <span className="block text-[10px] uppercase tracking-wide text-fg-subtle">Recomendado</span>
              <span className="block text-base font-extrabold text-accent">
                {formatarPreco(suggestion.priceRecommended)}
              </span>
            </div>
            <div className="bg-white rounded-lg p-2 border border-primary-100">
              <span className="block text-[10px] uppercase tracking-wide text-fg-subtle">Máximo</span>
              <span className="block text-sm font-bold text-fg">{formatarPreco(suggestion.priceMax)}</span>
            </div>
          </div>
          {suggestion.reasoning && (
            <p className="text-xs text-fg-muted leading-relaxed mb-2">{suggestion.reasoning}</p>
          )}
          <p className="text-[11px] text-fg-subtle mb-3">
            {suggestion.marketSampleSize > 0
              ? `Baseado em ${suggestion.marketSampleSize} ${suggestion.marketSampleSize === 1 ? 'anúncio comparável' : 'anúncios comparáveis'} no RecarGarage.`
              : 'Sem anúncios comparáveis publicados — estimativa do modelo para o mercado português.'}
          </p>
          <div className="flex items-center justify-between gap-2">
            <Button
              tipo="verde"
              tamanho="sm"
              onClick={() => onUsePrice(suggestion.priceRecommended)}
            >
              Usar este preço
            </Button>
            <span className="text-[10px] text-fg-subtle">
              Resultado gerado por IA — verifique antes de utilizar.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
