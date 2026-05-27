import { useNavigate } from 'react-router-dom';
import { formatarPreco, renderFoto } from '@/lib/utils';
import { useApp } from '@/providers/AppProvider';
import type { Carro } from '@/types/carro';

export default function CarCard({ carro }: { carro: Carro }) {
  const navigate = useNavigate();
  const { favoritos } = useApp();
  const { toggleFavorito, isFavorito } = favoritos;

  const isLowCost = carro.preco <= 2000;
  const isNovo = carro.dataAprovacao && (Date.now() - carro.dataAprovacao.toMillis()) < 24 * 60 * 60 * 1000;

  return (
    <div
      className="card-car bg-white rounded-2xl shadow-md overflow-hidden flex flex-col"
      onClick={() => navigate(`/detalhes/${carro.id}`)}
    >
      <div className="relative h-44 bg-slate-200 overflow-hidden">
        {carro.fotos && carro.fotos.length > 0 ? (() => {
          const fotoData = renderFoto(carro.fotos[0]);
          if (fotoData.type === 'img') {
            return <img src={fotoData.src} className={fotoData.classes} alt="Foto do anúncio" />;
          }
          return <div className="w-full h-full flex items-center justify-center text-5xl">{fotoData.emoji}</div>;
        })() : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-4xl">
            <i className="fa-solid fa-car"></i>
          </div>
        )}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isNovo && (
            <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">
              Novo
            </span>
          )}
          {isLowCost && (
            <span className="bg-accent text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">
              Low-Cost
            </span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorito(carro.id);
          }}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition shadow ${
            isFavorito(carro.id)
              ? 'bg-red-500 text-white'
              : 'bg-white/80 text-slate-600 hover:bg-white'
          }`}
        >
          <i className={`fa-solid fa-heart ${isFavorito(carro.id) ? '' : 'text-slate-400'}`}></i>
        </button>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-extrabold text-brand-900 text-base leading-tight mb-1">
          {carro.marca} {carro.modelo}
        </h3>
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
          <span>{carro.anoFabricacao}</span>
          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
          <span>{carro.km?.toLocaleString('pt-PT')} km</span>
          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
          <span>{carro.combustivel}</span>
        </div>
        {carro.vendedorNome && (
          <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-1">
            <i className="fa-solid fa-user"></i>
            <span className="truncate">{carro.vendedorNome}</span>
          </div>
        )}
        <div className="mt-auto flex items-center justify-between">
          <span className="text-xl font-extrabold text-accent">
            {formatarPreco(carro.preco)}
          </span>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <i className="fa-solid fa-location-dot"></i>
            {carro.local || 'Portugal'}
          </span>
        </div>
        {carro.estadoVeiculo === 'manutencao' && (
          <div className="mt-2 text-xs font-semibold text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-2 py-1 flex items-center gap-1">
            <i className="fa-solid fa-tools"></i>
            Precisa de manutenção
          </div>
        )}
      </div>
    </div>
  );
}
