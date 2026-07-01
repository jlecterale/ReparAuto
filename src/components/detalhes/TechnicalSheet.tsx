import { ClipboardText, Invoice, Phone, RoadHorizon, User } from '@phosphor-icons/react';
import { formatarPreco } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import type { Carro } from '@/types/carro';

export default function TechnicalSheet({ carro }: { carro: Carro | null }) {
  if (!carro) return null;

  const specs = [
    { label: 'Marca', value: carro.marca },
    { label: 'Modelo', value: carro.modelo },
    { label: 'Categoria', value: carro.bodyType },
    { label: 'Condição', value: carro.condition },
    { label: 'Ano de Fabricação', value: carro.anoFabricacao },
    { label: 'Ano Modelo', value: carro.anoModelo || '-' },
    { label: 'Quilómetros', value: carro.km ? `${carro.km.toLocaleString('pt-PT')} km` : '-' },
    { label: 'Combustível', value: carro.combustivel },
    { label: 'Câmbio', value: carro.cambio },
    { label: 'Tração', value: carro.traction },
    { label: 'Cor', value: carro.cor },
    { label: 'Nº Portas', value: carro.portas },
    { label: 'Lugares', value: carro.seats },
    { label: 'Potência', value: carro.power ? `${carro.power} cv` : undefined },
    { label: 'Cilindrada', value: carro.displacement ? `${carro.displacement} cc` : undefined },
    { label: 'Localização', value: carro.local || 'Portugal' },
  ].filter((s) => s.value !== undefined && s.value !== null && s.value !== '');

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
