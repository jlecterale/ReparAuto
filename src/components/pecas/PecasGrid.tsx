import { useApp } from '@/providers/AppProvider';
import PecasCard from './PecasCard';
import type { Peca } from '@/types/peca';

export default function PecasGrid({ onDetalhes }: { onDetalhes: (peca: Peca) => void }) {
  const { pecas } = useApp();
  const { pecasFiltradas } = pecas;

  const filtered = pecasFiltradas;

  if (filtered.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <i className="fa-solid fa-box-open text-4xl mb-3 text-slate-300"></i>
        <p className="font-semibold">Nenhum anúncio encontrado</p>
        <p className="text-sm">Experimente alterar o filtro ou publique o seu primeiro anúncio!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {filtered.map((peca) => (
        <PecasCard key={peca.id} peca={peca} onDetalhes={onDetalhes} />
      ))}
    </div>
  );
}
