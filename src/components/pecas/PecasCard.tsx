import { formatarPreco, renderFoto } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import LazyImage from '@/components/ui/LazyImage';
import type { Peca, TipoPeca } from '@/types/peca';

const tipoConfig: Record<TipoPeca, { cor: 'blue' | 'yellow' | 'gray'; icon: string; label: string }> = {
  venda: { cor: 'blue', icon: 'fa-solid fa-gears', label: 'Venda' },
  desmonte: { cor: 'yellow', icon: 'fa-solid fa-car', label: 'Desmonte' },
  procura: { cor: 'gray', icon: 'fa-solid fa-magnifying-glass', label: 'Procura-se' },
};

export default function PecasCard({ peca, onDetalhes }: { peca: Peca; onDetalhes: (peca: Peca) => void }) {
  const config = tipoConfig[peca.tipo] || tipoConfig.venda;
  const isNovo = peca.dataAprovacao && (Date.now() - peca.dataAprovacao.toMillis()) < 24 * 60 * 60 * 1000;
  const fotoData = peca.foto ? renderFoto(peca.foto) : null;

  return (
    <div
      className="card-car bg-white rounded-2xl shadow-md overflow-hidden flex flex-col"
      onClick={() => onDetalhes(peca)}
    >
      {fotoData?.type === 'img' && (
        <LazyImage src={fotoData.src} alt={peca.titulo} className="w-full h-36" />
      )}
      {fotoData?.type === 'emoji' && (
        <div className="w-full h-36 bg-slate-100 flex items-center justify-center text-5xl">
          {fotoData.emoji}
        </div>
      )}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Badge cor={config.cor}>
              <i className={`${config.icon} mr-1`}></i> {config.label}
            </Badge>
            {isNovo && (
              <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                Novo
              </span>
            )}
          </div>
          {peca.preco && (
            <span className="text-lg font-extrabold text-accent">
              {formatarPreco(peca.preco)}
            </span>
          )}
        </div>

        <h3 className="font-extrabold text-brand-900 text-base leading-tight mb-1">
          {peca.titulo}
        </h3>

        <div className="text-xs text-slate-500 space-y-1 mb-3">
          <p>
            <span className="font-semibold text-slate-600">Categoria:</span> {peca.categoria}
          </p>
          <p>
            <span className="font-semibold text-slate-600">Marca:</span> {peca.marcaCarro}
          </p>
          <p>
            <span className="font-semibold text-slate-600">Estado:</span> {peca.estado}
          </p>
        </div>

        {peca.descricao && (
          <p className="text-xs text-slate-600 line-clamp-2 mb-3 flex-1">
            {peca.descricao}
          </p>
        )}

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <i className="fa-solid fa-location-dot"></i>
            {peca.local || 'Portugal'}
          </span>
        </div>
      </div>
    </div>
  );
}
