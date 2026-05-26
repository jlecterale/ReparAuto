import { useApp } from '@/providers/AppProvider';

const filtros = [
  { value: 'todos', label: 'Todos os Anúncios' },
  { value: 'venda', label: 'Venda de Peças' },
  { value: 'desmonte', label: 'Carros p/ Desmonte' },
  { value: 'procura', label: 'Procura de Peças' },
];

export default function PecasFilter({ total }: { total: number }) {
  const { pecas } = useApp();
  const { filtroTipo, setFiltroTipo } = pecas;

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div className="flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide py-1 w-full sm:w-auto">
        {filtros.map((f) => (
          <button
            key={f.value}
            onClick={() => setFiltroTipo(f.value as 'todos' | 'venda' | 'desmonte' | 'procura')}
            className={`px-4 py-2 rounded-full text-xs font-bold border transition flex-shrink-0 ${
              filtroTipo === f.value
                ? 'bg-accent text-white border-accent'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="text-xs bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full font-medium self-end sm:self-auto">
        {total} anúncio{total !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
