import { useState } from 'react';
import { useApp } from '@/providers/AppProvider';
import PecasFilter from '@/components/pecas/PecasFilter';
import PecasGrid from '@/components/pecas/PecasGrid';
import CriarPecaModal from '@/components/pecas/CriarPecaModal';
import DetalhesPecaModal from '@/components/pecas/DetalhesPecaModal';
import type { Peca } from '@/types/peca';

export default function Pecas() {
  const { pecas } = useApp();
  const { pecasFiltradas } = pecas;

  const [criarModalAberto, setCriarModalAberto] = useState(false);
  const [detalhesPeca, setDetalhesPeca] = useState<Peca | null>(null);

  const filtered = pecasFiltradas;

  return (
    <div className="page-enter">
      <div className="bg-gradient-to-br from-brand-800 to-brand-900 rounded-2xl p-5 sm:p-8 text-white mb-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">Mercado de Peças & Desmonte</h1>
            <p className="mt-2 text-gray-300 text-sm sm:text-base">
              Compra, venda e procura de peças automóveis ou veículos completos para desmantelamento.
            </p>
            <button
              onClick={() => setCriarModalAberto(true)}
              className="mt-4 bg-accent hover:bg-accent-hover text-white font-bold px-5 py-2.5 rounded-full transition text-sm sm:text-base shadow-md flex items-center gap-2"
            >
              <i className="fa-solid fa-circle-plus"></i> Publicar Peça ou Pedido
            </button>
          </div>
        </div>
        <i className="fa-solid fa-gears absolute right-[-20px] bottom-[-20px] text-white/5 text-[15rem] pointer-events-none transform -rotate-12"></i>
      </div>

      <PecasFilter total={filtered.length} />
      <PecasGrid onDetalhes={(peca: Peca) => setDetalhesPeca(peca)} />

      <CriarPecaModal
        show={criarModalAberto}
        onClose={() => setCriarModalAberto(false)}
      />
      <DetalhesPecaModal
        show={!!detalhesPeca}
        onClose={() => setDetalhesPeca(null)}
        peca={detalhesPeca}
      />
    </div>
  );
}
