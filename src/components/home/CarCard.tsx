'use client';

import { Car, Heart, MapPin, User, Wrench } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { formatarPreco, renderFoto } from '@/lib/utils';
import { useApp } from '@/providers/AppProvider';
import LazyImage from '@/components/ui/LazyImage';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';
import PriceIndicatorBadge from '@/components/preco/PriceIndicatorBadge';
import usePriceIndicator from '@/hooks/usePriceIndicator';
import type { Carro } from '@/types/carro';

export default function CarCard({ carro }: { carro: Carro }) {
  const router = useRouter();
  const { favoritos } = useApp();
  const { toggleFavorito, isFavorito } = favoritos;

  const isLowCost = carro.preco <= 2000;
  const isNovo = carro.dataAprovacao && (Date.now() - carro.dataAprovacao.toMillis()) < 24 * 60 * 60 * 1000;
  const priceInfo = usePriceIndicator(carro);

  return (
    <div
      className="card-car bg-white rounded-2xl shadow-md overflow-hidden flex flex-col"
      onClick={() => router.push(`/detalhes/${carro.id}`)}
    >
      <div className="relative h-44 bg-slate-200 overflow-hidden">
        {carro.fotos && carro.fotos.length > 0 ? (() => {
          const fotoData = renderFoto(carro.fotos[0]);
          if (fotoData.type === 'img') {
            return <LazyImage src={fotoData.src} alt="Foto do anúncio" className="w-full h-full" />;
          }
          return <div className="w-full h-full flex items-center justify-center text-5xl">{fotoData.emoji}</div>;
        })() : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-4xl">
            <Car />
          </div>
        )}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isNovo && <Badge cor="green" variante="solid" className="shadow">Novidade</Badge>}
          {isLowCost && <Badge cor="accent" variante="solid" className="shadow">Low-Cost</Badge>}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorito(carro.id);
          }}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition shadow ${
            isFavorito(carro.id)
              ? 'bg-red-500 text-white'
              : 'bg-white/80 text-fg-muted hover:bg-white'
          }`}
        >
          <Heart weight={isFavorito(carro.id) ? 'fill' : 'regular'} className={isFavorito(carro.id) ? '' : 'text-slate-400'} />
        </button>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-extrabold text-fg-heading text-base leading-tight mb-1">
          {carro.marca} {carro.modelo}
        </h3>
        <div className="flex items-center gap-2 text-xs text-fg-subtle mb-2">
          <span>{carro.anoFabricacao}</span>
          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
          <span>{carro.km?.toLocaleString('pt-PT')} km</span>
          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
          <span>{carro.combustivel}</span>
        </div>
        {carro.vendedorNome && (
          <div className="flex items-center gap-1 text-[11px] text-fg-muted mb-1">
            <User />
            <span className="truncate">{carro.vendedorNome}</span>
          </div>
        )}
        <div className="mt-auto flex items-center justify-between">
          <span className="text-xl font-extrabold text-accent">
            {formatarPreco(carro.preco)}
          </span>
          <span className="text-xs text-fg-muted flex items-center gap-1">
            <MapPin />
            {carro.local || 'Portugal'}
          </span>
        </div>
        {priceInfo.indicator !== 'indisponivel' && (
          <div className="mt-2">
            <PriceIndicatorBadge
              indicator={priceInfo.indicator}
              deviation={priceInfo.deviation}
              compact
            />
          </div>
        )}
        {carro.estadoVeiculo === 'manutencao' && (
          <Alert
            tipo="aviso"
            icone={<Wrench />}
            className="mt-2 !p-2 !rounded-lg !items-center font-semibold"
          >
            Precisa de manutenção
          </Alert>
        )}
      </div>
    </div>
  );
}
