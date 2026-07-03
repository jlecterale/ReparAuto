'use client';

import { useState } from 'react';
import { Scales, X } from '@phosphor-icons/react';
import Button from '@/components/ui/Button';
import CompareModal from '@/components/busca/CompareModal';
import { useApp } from '@/providers/AppProvider';
import useCompare from '@/hooks/useCompare';
import { MAX_COMPARE } from '@/lib/compare';
import type { Carro } from '@/types/carro';

/**
 * Floating bar shown while the user picks vehicles to compare (GAP-16).
 * Renders nothing until at least one car is selected. Sits above the mobile
 * bottom nav (z-50) and below modals (z-100).
 */
export default function CompareBar() {
  const { ids, toggle, clear } = useCompare();
  const { carros } = useApp();
  const [showModal, setShowModal] = useState(false);

  const selecionados = ids
    .map((id) => carros.carros.find((c) => c.id === id))
    .filter((c): c is Carro => Boolean(c));

  if (selecionados.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-[88px] md:bottom-4 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-1.5rem)] max-w-xl">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 px-3 py-2.5 flex items-center gap-2">
          <span className="text-accent shrink-0" aria-hidden="true">
            <Scales size={20} weight="fill" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-fg-heading">
              Comparar veículos ({selecionados.length}/{MAX_COMPARE})
            </p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {selecionados.map((carro) => (
                <span
                  key={carro.id}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-50 border border-slate-200 rounded-full pl-2 pr-1 py-0.5 text-fg max-w-36"
                >
                  <span className="truncate">{carro.marca} {carro.modelo}</span>
                  <button
                    onClick={() => toggle(carro.id)}
                    aria-label={`Remover ${carro.marca} ${carro.modelo} da comparação`}
                    className="w-4 h-4 rounded-full flex items-center justify-center text-fg-muted hover:text-red-600 shrink-0"
                  >
                    <X size={10} weight="bold" />
                  </button>
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              tamanho="sm"
              disabled={selecionados.length < 2}
              onClick={() => setShowModal(true)}
              title={selecionados.length < 2 ? 'Selecione pelo menos 2 veículos' : undefined}
            >
              Comparar
            </Button>
            <button
              onClick={clear}
              aria-label="Limpar comparação"
              className="text-xs font-semibold text-fg-muted hover:text-fg px-1.5 py-1"
            >
              Limpar
            </button>
          </div>
        </div>
      </div>

      <CompareModal
        show={showModal}
        onClose={() => setShowModal(false)}
        carros={selecionados}
        onRemove={(id) => toggle(id)}
      />
    </>
  );
}
