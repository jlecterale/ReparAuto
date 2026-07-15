'use client';

import { Sparkle } from '@phosphor-icons/react';
import useAIDescription from '@/hooks/useAIDescription';
import Button from '@/components/ui/Button';
import { parsePositiveInt } from '@/lib/utils';
import type { CarroFormData } from '@/types/carro';
import type { AIDescriptionRequest } from '@/types/ia';

interface AIDescriptionButtonProps {
  dados: CarroFormData;
  uid?: string;
  onGenerated: (description: string) => void;
}

function buildRequest(dados: CarroFormData): AIDescriptionRequest {
  return {
    marca: dados.marca.trim(),
    modelo: dados.modelo.trim(),
    anoFabricacao: Number(dados.anoFabricacao),
    anoModelo: parsePositiveInt(dados.anoModelo) ?? undefined,
    km: parsePositiveInt(dados.km) ?? undefined,
    combustivel: dados.combustivel,
    cambio: dados.cambio,
    cor: dados.cor.trim() || undefined,
    portas: parsePositiveInt(dados.portas) ?? undefined,
    bodyType: dados.bodyType || undefined,
    condition: dados.condition || undefined,
    power: parsePositiveInt(dados.power) ?? undefined,
    displacement: parsePositiveInt(dados.displacement) ?? undefined,
    traction: dados.traction || undefined,
    features: dados.features.length ? dados.features : undefined,
    local: dados.localizacao || undefined,
    estadoVeiculo: dados.estadoVeiculo,
    tiposManutencao: dados.tiposManutencao.length ? dados.tiposManutencao : undefined,
    rodando: dados.rodando !== 'nao',
    inspecao: dados.inspecao !== 'nao',
  };
}

/**
 * "Gerar descrição com IA" — calls the Cloud Function proxy and hands the
 * sanitized result to the parent form. Enabled once the vehicle basics
 * (marca, modelo, ano) exist.
 */
export default function AIDescriptionButton({ dados, uid, onGenerated }: AIDescriptionButtonProps) {
  const { generate, loading, error, remaining } = useAIDescription(uid);

  const ready = Boolean(dados.marca.trim() && dados.modelo.trim() && dados.anoFabricacao);
  const exhausted = remaining === 0;

  const handleClick = async () => {
    const description = await generate(buildRequest(dados));
    if (description) onGenerated(description);
  };

  return (
    <div>
      <Button
        tipo="primario"
        tamanho="sm"
        icone={<Sparkle weight="fill" />}
        onClick={handleClick}
        disabled={!ready || exhausted}
        carregando={loading}
        className="bg-gradient-to-r from-primary-600 to-accent hover:from-primary-700 hover:to-accent-hover"
        title={ready ? undefined : 'Preencha marca, modelo e ano primeiro'}
      >
        {loading ? 'A gerar…' : 'Gerar com IA'}
      </Button>
      {!ready && (
        <p className="text-[11px] text-fg-subtle mt-1">
          Preencha marca, modelo e ano no passo anterior para gerar a descrição.
        </p>
      )}
      {exhausted && (
        <p className="text-[11px] text-warning-600 mt-1">
          Limite semanal de gerações com IA atingido.
        </p>
      )}
      {error && <p className="text-xs text-danger-600 mt-1">{error}</p>}
    </div>
  );
}
