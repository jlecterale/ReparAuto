import { useApp } from '@/providers/AppProvider';
import { CATEGORIAS_PECAS, ESTADOS_PECA } from '@/lib/constants';

const filtros = [
  { value: 'todos', label: 'Todos os Anúncios' },
  { value: 'venda', label: 'Venda de Peças' },
  { value: 'desmonte', label: 'Carros p/ Desmonte' },
  { value: 'procura', label: 'Procura de Peças' },
];

export default function PecasFilter({ total }: { total: number }) {
  const { pecas } = useApp();
  const {
    filtroTipo,
    setFiltroTipo,
    searchTerm,
    setSearchTerm,
    filtroCategoria,
    setFiltroCategoria,
    filtroEstado,
    setFiltroEstado,
  } = pecas;

  const hasActiveFilters = searchTerm.trim() || filtroCategoria || filtroEstado;

  const limparFiltros = () => {
    setSearchTerm('');
    setFiltroCategoria('');
    setFiltroEstado('');
  };

  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Procurar peças, marcas ou categorias..."
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          )}
        </div>

        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition appearance-none cursor-pointer min-w-[180px]"
        >
          <option value="">Todas as Categorias</option>
          {CATEGORIAS_PECAS.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition appearance-none cursor-pointer min-w-[160px]"
        >
          <option value="">Todos os Estados</option>
          {ESTADOS_PECA.map((est) => (
            <option key={est} value={est}>
              {est}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide py-1 w-full sm:w-auto">
          {filtros.map((f) => (
            <button
              key={f.value}
              onClick={() => setFiltroTipo(f.value as 'todos' | 'venda' | 'desmonte' | 'procura')}
              className={`px-4 py-2 rounded-full text-xs font-bold border transition flex-shrink-0 cursor-pointer ${
                filtroTipo === f.value
                  ? 'bg-accent text-white border-accent'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="text-xs bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full font-medium self-end sm:self-auto flex-shrink-0">
          {total} anúncio{total !== 1 ? 's' : ''}
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {searchTerm.trim() && (
            <span className="inline-flex items-center gap-1.5 bg-accent/10 text-accent text-xs font-semibold px-3 py-1.5 rounded-full">
              <i className="fa-solid fa-magnifying-glass text-[10px]" />
              &ldquo;{searchTerm.trim()}&rdquo;
              <button onClick={() => setSearchTerm('')} className="hover:text-accent-hover ml-0.5 cursor-pointer">
                <i className="fa-solid fa-xmark" />
              </button>
            </span>
          )}
          {filtroCategoria && (
            <span className="inline-flex items-center gap-1.5 bg-accent/10 text-accent text-xs font-semibold px-3 py-1.5 rounded-full">
              {filtroCategoria}
              <button onClick={() => setFiltroCategoria('')} className="hover:text-accent-hover ml-0.5 cursor-pointer">
                <i className="fa-solid fa-xmark" />
              </button>
            </span>
          )}
          {filtroEstado && (
            <span className="inline-flex items-center gap-1.5 bg-accent/10 text-accent text-xs font-semibold px-3 py-1.5 rounded-full">
              {filtroEstado}
              <button onClick={() => setFiltroEstado('')} className="hover:text-accent-hover ml-0.5 cursor-pointer">
                <i className="fa-solid fa-xmark" />
              </button>
            </span>
          )}
          <button
            onClick={limparFiltros}
            className="text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2 ml-1 cursor-pointer"
          >
            Limpar todos
          </button>
        </div>
      )}
    </div>
  );
}
