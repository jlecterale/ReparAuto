import { useApp } from '@/providers/AppProvider';
import CarCard from './CarCard';

export default function CarGrid() {
  const { carros } = useApp();
  const { carrosFiltrados, filtroAtivo } = carros;

  const filtered = carrosFiltrados;

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
      <h2 id="ofertas" className="text-xl font-bold text-brand-900 mb-3 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <i className="fa-solid fa-bolt text-accent"></i> Oportunidades
        </span>
        <span className="text-xs bg-slate-200 text-slate-700 px-3 py-1 rounded-full font-medium">
          {getFiltroLabel()}
        </span>
      </h2>

      {filtered.length === 0 ? (
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
