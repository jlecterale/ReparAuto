import { ClipboardText, Invoice, Phone, RoadHorizon, User } from '@phosphor-icons/react';
import { formatarPreco } from '@/lib/utils';
import { MESES } from '@/lib/constants';
import { docCountry } from '@/lib/country';
import { term } from '@/lib/terms';
import Badge from '@/components/ui/Badge';
import type { Carro } from '@/types/carro';

export default function TechnicalSheet({ carro }: { carro: Carro | null }) {
  if (!carro) return null;

  // Spec sheet of a specific listing → label by the listing's market, not the viewer's.
  const country = docCountry(carro);

  const consumo = (l?: number) => (l != null ? `${l.toLocaleString('pt-PT')} l/100 km` : undefined);

  const specs = [
    { label: 'Marca', value: carro.marca },
    { label: 'Modelo', value: carro.modelo },
    { label: 'Versão', value: carro.version },
    { label: 'Categoria', value: carro.bodyType },
    { label: 'Condição', value: carro.condition },
    { label: 'Origem', value: carro.origin },
    { label: 'Ano de Fabricação', value: carro.anoFabricacao },
    { label: term('firstRegistrationLabel', country), value: carro.firstRegistrationMonth ? MESES[carro.firstRegistrationMonth - 1] : undefined },
    { label: 'Ano Modelo', value: carro.anoModelo || '-' },
    { label: 'Quilómetros', value: carro.km ? `${carro.km.toLocaleString('pt-PT')} km` : '-' },
    { label: 'Proprietários anteriores', value: carro.previousOwners != null ? String(carro.previousOwners) : undefined },
    { label: 'Combustível', value: carro.combustivel },
    { label: 'Câmbio', value: carro.cambio },
    { label: 'Nº de mudanças', value: carro.gears },
    { label: 'Tração', value: carro.traction },
    { label: 'Cor', value: carro.cor },
    { label: 'Nº Portas', value: carro.portas },
    { label: 'Lugares', value: carro.seats },
    { label: 'Estofos', value: carro.upholstery },
    { label: 'Nº de airbags', value: carro.numberOfAirbags },
    { label: 'Potência', value: carro.power ? `${carro.power} cv` : undefined },
    { label: 'Cilindrada', value: carro.displacement ? `${carro.displacement} cc` : undefined },
    { label: 'Emissões CO₂', value: carro.co2Emissions != null ? `${carro.co2Emissions} g/km` : undefined },
    { label: 'Autonomia', value: carro.maxFuelRange != null ? `${carro.maxFuelRange} km` : undefined },
    { label: 'Consumo urbano', value: consumo(carro.consumptionUrban) },
    { label: 'Consumo extra-urbano', value: consumo(carro.consumptionExtraUrban) },
    { label: 'Consumo combinado', value: consumo(carro.consumptionCombined) },
    { label: 'Garantia', value: carro.warrantyMonths != null ? `${carro.warrantyMonths} meses` : undefined },
    { label: 'Localização', value: [carro.bairro, carro.local].filter(Boolean).join(', ') || 'Portugal' },
  ].filter((s) => s.value !== undefined && s.value !== null && s.value !== '');

  const comercial = [
    carro.acceptsFinancing && 'Aceita financiamento',
    carro.vatDeductible && 'IVA dedutível',
    carro.acceptsExchange && 'Aceita retoma',
  ].filter(Boolean) as string[];

  return (
    <div className="bg-slate-50 rounded-xl p-4 sm:p-5 border border-slate-200">
      <h3 className="font-extrabold text-fg-heading mb-3 flex items-center gap-2">
        <ClipboardText className="text-accent" /> Ficha Técnica
      </h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
        {specs.map((s) => (
          <div key={s.label} className="flex flex-col">
            <span className="text-xs font-semibold text-fg-subtle">{s.label}</span>
            <span className="font-semibold text-fg-heading">{s.value}</span>
          </div>
        ))}
      </div>

      {carro.features && carro.features.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <span className="text-xs font-semibold text-fg-subtle block mb-2">Equipamento & Extras</span>
          <div className="flex flex-wrap gap-1.5">
            {carro.features.map((f) => (
              <Badge key={f} cor="blue">{f}</Badge>
            ))}
          </div>
        </div>
      )}

      {comercial.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <span className="text-xs font-semibold text-fg-subtle block mb-2">Condições comerciais</span>
          <div className="flex flex-wrap gap-1.5">
            {comercial.map((c) => (
              <Badge key={c} cor="green">{c}</Badge>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-slate-200">
        <span className="text-xs font-semibold text-fg-subtle block mb-2">Estado do Veículo</span>
        {carro.estadoVeiculo === 'pronto' ? (
          <Badge cor="green">Pronto para rodar</Badge>
        ) : (
          <div className="space-y-2">
            <Badge cor="yellow">Precisa de manutenção</Badge>
            {carro.rodando !== undefined && (
              <p className="text-xs text-fg-muted mt-1">
                <RoadHorizon className="mr-1 text-slate-400" />
                {carro.rodando ? 'A rodar' : 'Parado'}
              </p>
            )}
            {carro.inspecao !== undefined && (
              <p className="text-xs text-fg-muted">
                <Invoice className="mr-1 text-slate-400" />
                {carro.inspecao ? 'Com Inspeção' : 'Sem Inspeção'}
              </p>
            )}
            {carro.tiposManutencao && carro.tiposManutencao.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {carro.tiposManutencao.map((t: string) => (
                  <Badge key={t} cor="gray">{t}</Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {carro.orcamentoTexto && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <span className="text-xs font-semibold text-fg-subtle block mb-1">Orçamento preexistente</span>
          <p className="text-sm text-fg bg-white rounded-lg p-3 border border-slate-200 whitespace-pre-wrap">
            {carro.orcamentoTexto}
          </p>
          {(carro.mecanicoNome || carro.mecanicoTelefone) && (
            <div className="text-xs text-fg-subtle mt-2 space-y-1">
              {carro.mecanicoNome && <p><User className="mr-1" />{carro.mecanicoNome}</p>}
              {carro.mecanicoTelefone && <p><Phone className="mr-1" />{carro.mecanicoTelefone}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
