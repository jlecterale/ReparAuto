import { formatarPreco } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import type { Carro } from '@/types/carro';

export default function TechnicalSheet({ carro }: { carro: Carro | null }) {
  if (!carro) return null;

  const specs = [
    { label: 'Marca', value: carro.marca },
    { label: 'Modelo', value: carro.modelo },
    { label: 'Ano de Fabricação', value: carro.anoFabricacao },
    { label: 'Ano Modelo', value: carro.anoModelo || '-' },
    { label: 'Quilómetros', value: carro.km ? `${carro.km.toLocaleString('pt-PT')} km` : '-' },
    { label: 'Combustível', value: carro.combustivel },
    { label: 'Câmbio', value: carro.cambio },
    { label: 'Cor', value: carro.cor },
    { label: 'Nº Portas', value: carro.portas },
    { label: 'Localização', value: carro.local || 'Portugal' },
  ];

  return (
    <div className="bg-slate-50 rounded-xl p-4 sm:p-5 border border-slate-200">
      <h3 className="font-extrabold text-brand-900 mb-3 flex items-center gap-2">
        <i className="fa-solid fa-clipboard-list text-accent"></i> Ficha Técnica
      </h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
        {specs.map((s) => (
          <div key={s.label} className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500">{s.label}</span>
            <span className="font-semibold text-brand-800">{s.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-200">
        <span className="text-xs font-semibold text-slate-500 block mb-2">Estado do Veículo</span>
        {carro.estadoVeiculo === 'pronto' ? (
          <Badge cor="green">Pronto para rodar</Badge>
        ) : (
          <div className="space-y-2">
            <Badge cor="yellow">Precisa de manutenção</Badge>
            {carro.rodando !== undefined && (
              <p className="text-xs text-slate-600 mt-1">
                <i className="fa-solid fa-road mr-1 text-slate-400"></i>
                {carro.rodando ? 'A rodar' : 'Parado'}
              </p>
            )}
            {carro.inspecao !== undefined && (
              <p className="text-xs text-slate-600">
                <i className="fa-solid fa-file-invoice mr-1 text-slate-400"></i>
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
          <span className="text-xs font-semibold text-slate-500 block mb-1">Orçamento preexistente</span>
          <p className="text-sm text-slate-700 bg-white rounded-lg p-3 border border-slate-200 whitespace-pre-wrap">
            {carro.orcamentoTexto}
          </p>
          {(carro.mecanicoNome || carro.mecanicoTelefone) && (
            <div className="text-xs text-slate-500 mt-2 space-y-1">
              {carro.mecanicoNome && <p><i className="fa-solid fa-user mr-1"></i>{carro.mecanicoNome}</p>}
              {carro.mecanicoTelefone && <p><i className="fa-solid fa-phone mr-1"></i>{carro.mecanicoTelefone}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
