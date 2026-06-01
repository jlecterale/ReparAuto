import { GearSix, Car, MagnifyingGlass, MapPin, type Icon } from '@phosphor-icons/react';
import { formatarPreco, renderFoto } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import LazyImage from '@/components/ui/LazyImage';
import type { Peca, TipoPeca } from '@/types/peca';

const tipoConfig: Record<TipoPeca, { cor: 'blue' | 'yellow' | 'gray'; Icon: Icon; label: string }> = {
  venda: { cor: 'blue', Icon: GearSix, label: 'Venda' },
  desmonte: { cor: 'yellow', Icon: Car, label: 'Desmonte' },
  procura: { cor: 'gray', Icon: MagnifyingGlass, label: 'Procura-se' },
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
              <config.Icon className="mr-1" /> {config.label}
            </Badge>
            {isNovo && <Badge cor="green" variante="solid">Novidade</Badge>}
          </div>
          {peca.preco && (
            <span className="text-lg font-extrabold text-accent">
              {formatarPreco(peca.preco)}
            </span>
          )}
        </div>

        <h3 className="font-extrabold text-fg-heading text-base leading-tight mb-1">
          {peca.titulo}
        </h3>

        <div className="text-xs text-fg-muted space-y-1 mb-3">
          <p>
            <span className="font-semibold text-fg">Categoria:</span> {peca.categoria}
          </p>
          <p>
            <span className="font-semibold text-fg">Marca:</span> {peca.marcaCarro}
          </p>
          <p>
            <span className="font-semibold text-fg">Estado:</span> {peca.estado}
          </p>
        </div>

        {peca.descricao && (
          <p className="text-xs text-fg line-clamp-2 mb-3 flex-1">
            {peca.descricao}
          </p>
        )}

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-neutral-100">
          <span className="text-xs text-fg-muted flex items-center gap-1">
            <MapPin />
            {peca.local || 'Portugal'}
          </span>
        </div>
      </div>
    </div>
  );
}
