import { useState } from 'react';
import { useApp } from '@/providers/AppProvider';
import { CONCELHOS } from '@/lib/constants';
import CarCard from './CarCard';
import { CarCardSkeleton } from '@/components/ui/Skeleton';

export default function CarGrid() {
  const { carros } = useApp();
  const { carrosFiltrados, filtroAtivo, searchQuery, setSearchQuery, advPriceMin, setAdvPriceMin, advPriceMax, setAdvPriceMax, advLocation, setAdvLocation, sortOrdem, setSortOrdem } = carros;

  const filtered = carrosFiltrados;

  const [showAdvanced, setShowAdvanced] = useState(false);

  const limparFiltrosAvancados = () => {
    setAdvPriceMin(null);
    setAdvPriceMax(null);
    setAdvLocation('');
    setSortOrdem(null);
  };

  const getFiltroLabel = () => {
    switch (filtroAtivo) {
      case 'lowcost': return 'Destaques Low-Cost (Até 2.000€)';
      case '500': return 'Até 500€';
      case '1000': return 'Até 1.000€';
      case 'qualquer': return 'Qualquer Valor';
      default: return 'Todos os anúncios';
    }
  };

  return (
    <>
      <div className="mb-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input
              type="text"
              placeholder="Ex: Renault Clio, Peugeot 206..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full bg-white text-slate-700 placeholder-slate-400 border border-slate-300 focus:outline-none focus:border-accent transition text-sm"
            />
          </div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-3 py-2 rounded-full transition flex items-center justify-center gap-1 text-xs font-semibold flex-shrink-0"
          >
            <i className="fa-solid fa-sliders"></i> Filtros
          </button>
        </div>

        {showAdvanced && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Preço Mínimo (€)</label>
                <input
                  type="number"
                  placeholder="Mínimo"
                  value={advPriceMin ?? ''}
                  onChange={(e) => setAdvPriceMin(e.target.value ? Number(e.target.value) : null)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Preço Máximo (€)</label>
                <input
                  type="number"
                  placeholder="Máximo"
                  value={advPriceMax ?? ''}
                  onChange={(e) => setAdvPriceMax(e.target.value ? Number(e.target.value) : null)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Localização (Concelho)</label>
                <div className="relative">
                  <input
                    type="text"
                    list="concelhos-list"
                    placeholder="Escrever concelho..."
                    value={advLocation}
                    onChange={(e) => setAdvLocation(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl pl-3 pr-8 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-accent"
                  />
                  <datalist id="concelhos-list">
                    {CONCELHOS.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                  <i className="fa-solid fa-location-dot absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                </div>
              </div>
              <div className="sm:col-span-3 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 text-xs">
                <span className="block text-xs font-bold text-slate-500 mr-2">Ordenar por preço:</span>
                <button
                  type="button"
                  onClick={() => setSortOrdem('crescente')}
                  className={`font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                    sortOrdem === 'crescente' ? 'bg-accent text-white' : 'bg-white hover:bg-slate-100 border border-slate-300 text-slate-700'
                  }`}
                >
                  <i className="fa-solid fa-arrow-trend-up"></i> Preço mais baixo
                </button>
                <button
                  type="button"
                  onClick={() => setSortOrdem('decrescente')}
                  className={`font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                    sortOrdem === 'decrescente' ? 'bg-accent text-white' : 'bg-white hover:bg-slate-100 border border-slate-300 text-slate-700'
                  }`}
                >
                  <i className="fa-solid fa-arrow-trend-down"></i> Preço mais caro
                </button>
              </div>
              <div className="sm:col-span-3 flex justify-between items-center gap-2 pt-2 border-t border-slate-200 text-xs">
                <button
                  onClick={() => { limparFiltrosAvancados(); setShowAdvanced(false); }}
                  className="border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold px-4 py-2 rounded-xl transition"
                >
                  Limpar
                </button>
                <button
                  onClick={() => { setShowAdvanced(false); }}
                  className="bg-accent hover:bg-accent-hover text-white font-bold px-4 py-2 rounded-xl transition"
                >
                  Aplicar Filtros
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <h2 id="ofertas" className="text-xl font-bold text-brand-900 mb-3 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <i className="fa-solid fa-bolt text-accent"></i> Oportunidades
        </span>
        <span className="text-xs bg-slate-200 text-slate-700 px-3 py-1 rounded-full font-medium">
          {getFiltroLabel()}
        </span>
      </h2>

      {carros.loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <CarCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <i className="fa-solid fa-car-side text-4xl mb-3 text-slate-300"></i>
          <p className="font-semibold">Nenhum anúncio encontrado</p>
          <p className="text-sm">Tente alterar os filtros ou pesquisa.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {filtered.map((carro) => (
            <CarCard key={carro.id} carro={carro} />
          ))}
        </div>
      )}
    </>
  );
}
