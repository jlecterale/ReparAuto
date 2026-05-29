'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import PecasFilter from '@/components/pecas/PecasFilter';
import PecasGrid from '@/components/pecas/PecasGrid';
import CriarPecaModal from '@/components/pecas/CriarPecaModal';
import DetalhesPecaModal from '@/components/pecas/DetalhesPecaModal';
import DesmancharCarroModal from '@/components/pecas/DesmancharCarroModal';
import { getPecaPorId } from '@/lib/db';
import type { Peca } from '@/types/peca';

export default function Pecas() {
  const { pecas } = useApp();
  const { pecasFiltradas, pecas: allPecas } = pecas;
  const router = useRouter();
  const searchParams = useSearchParams();
  const pecaIdFromQuery = searchParams?.get('peca') ?? null;

  const [criarModalAberto, setCriarModalAberto] = useState(false);
  const [desmancharAberto, setDesmancharAberto] = useState(false);
  const [detalhesPeca, setDetalhesPeca] = useState<Peca | null>(null);

  useEffect(() => {
    if (!pecaIdFromQuery) return;
    const local = allPecas.find((p) => p.id === pecaIdFromQuery);
    if (local) {
      setDetalhesPeca(local);
      return;
    }
    let cancelled = false;
    getPecaPorId(pecaIdFromQuery).then((p) => {
      if (!cancelled && p) setDetalhesPeca(p);
    });
    return () => { cancelled = true; };
  }, [pecaIdFromQuery, allPecas]);

  const closeDetalhes = () => {
    setDetalhesPeca(null);
    if (pecaIdFromQuery) router.replace('/pecas');
  };

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
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => setCriarModalAberto(true)}
                className="bg-accent hover:bg-accent-hover text-white font-bold px-5 py-2.5 rounded-full transition text-sm sm:text-base shadow-md flex items-center gap-2"
              >
                <i className="fa-solid fa-circle-plus"></i> Publicar Peça ou Pedido
              </button>
              <button
                onClick={() => setDesmancharAberto(true)}
                className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold px-5 py-2.5 rounded-full transition text-sm sm:text-base flex items-center gap-2"
              >
                <i className="fa-solid fa-car-burst"></i> Desmanchar Carro
              </button>
            </div>
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
      <DesmancharCarroModal
        show={desmancharAberto}
        onClose={() => setDesmancharAberto(false)}
      />
      <DetalhesPecaModal
        show={!!detalhesPeca}
        onClose={closeDetalhes}
        peca={detalhesPeca}
      />
    </div>
  );
}
