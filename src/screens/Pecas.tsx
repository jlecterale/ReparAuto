'use client';

import { GearSix, PlusCircle, Wrench } from '@phosphor-icons/react';
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
import Button from '@/components/ui/Button';

export default function Pecas({ initialPecaId }: { initialPecaId?: string } = {}) {
  const { pecas } = useApp();
  const { pecasFiltradas, pecas: allPecas } = pecas;
  const router = useRouter();
  const searchParams = useSearchParams();
  // The part to auto-open: the /pecas/[id] route param wins, else the legacy
  // ?peca= deep link.
  const pecaIdAlvo = initialPecaId ?? searchParams?.get('peca') ?? null;

  const [criarModalAberto, setCriarModalAberto] = useState(false);
  const [desmancharAberto, setDesmancharAberto] = useState(false);
  const [detalhesPeca, setDetalhesPeca] = useState<Peca | null>(null);

  useEffect(() => {
    if (!pecaIdAlvo) return;
    const local = allPecas.find((p) => p.id === pecaIdAlvo);
    if (local) {
      setDetalhesPeca(local);
      return;
    }
    let cancelled = false;
    getPecaPorId(pecaIdAlvo).then((p) => {
      if (!cancelled && p) setDetalhesPeca(p);
    });
    return () => { cancelled = true; };
  }, [pecaIdAlvo, allPecas]);

  const closeDetalhes = () => {
    setDetalhesPeca(null);
    if (pecaIdAlvo) router.replace('/pecas');
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
              <Button
                tipo="primario"
                icone={<PlusCircle />}
                onClick={() => setCriarModalAberto(true)}
                className="rounded-full shadow-md"
              >
                Publicar Peça ou Pedido
              </Button>
              <Button
                tipo="secundario"
                icone={<Wrench />}
                onClick={() => setDesmancharAberto(true)}
                className="rounded-full !bg-white/10 hover:!bg-white/20 !border-white/30 !text-white"
              >
                Desmanchar Carro
              </Button>
            </div>
          </div>
        </div>
        <GearSix className="absolute right-[-20px] bottom-[-20px] text-white/5 text-[15rem] pointer-events-none transform -rotate-12" />
      </div>

      <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-6 lg:items-start">
        <PecasFilter total={filtered.length} />
        <section className="min-w-0">
          <PecasGrid onDetalhes={setDetalhesPeca} onPublicar={() => setCriarModalAberto(true)} />
        </section>
      </div>

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
