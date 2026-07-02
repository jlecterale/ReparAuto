'use client';

import { useRouter } from 'next/navigation';
import { X, Car } from '@phosphor-icons/react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import LazyImage from '@/components/ui/LazyImage';
import { renderFoto } from '@/lib/utils';
import { buildCompareRows } from '@/lib/compare';
import type { Carro } from '@/types/carro';

interface CompareModalProps {
  show: boolean;
  onClose: () => void;
  carros: Carro[];
  onRemove: (id: string) => void;
}

function Thumb({ carro }: { carro: Carro }) {
  if (carro.fotos && carro.fotos.length > 0) {
    const foto = renderFoto(carro.fotos[0]);
    if (foto.type === 'img') {
      return <LazyImage src={foto.src} alt={`${carro.marca} ${carro.modelo}`} className="w-full h-20 rounded-lg" />;
    }
    return <div className="w-full h-20 rounded-lg bg-slate-100 flex items-center justify-center text-3xl">{foto.emoji}</div>;
  }
  return (
    <div className="w-full h-20 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-2xl">
      <Car />
    </div>
  );
}

export default function CompareModal({ show, onClose, carros, onRemove }: CompareModalProps) {
  const router = useRouter();
  const rows = buildCompareRows(carros);

  return (
    <Modal show={show} onClose={onClose} titulo="Comparar veículos" tamanho="xl">
      {carros.length < 2 ? (
        <p className="text-sm text-fg-muted py-6 text-center">
          Selecione pelo menos 2 veículos para comparar.
        </p>
      ) : (
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full text-sm border-separate border-spacing-0 min-w-[560px]">
            <thead>
              <tr>
                <th className="sticky left-0 bg-white z-10 w-36 min-w-36" aria-label="Característica" />
                {carros.map((carro) => (
                  <th key={carro.id} className="p-2 align-top text-left font-normal min-w-40">
                    <div className="relative">
                      <Thumb carro={carro} />
                      <button
                        onClick={() => onRemove(carro.id)}
                        aria-label={`Remover ${carro.marca} ${carro.modelo} da comparação`}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border border-slate-200 shadow flex items-center justify-center text-fg-muted hover:text-red-600 transition"
                      >
                        <X size={12} weight="bold" />
                      </button>
                    </div>
                    <p className="font-extrabold text-fg-heading mt-2 leading-tight">
                      {carro.marca} {carro.modelo}
                    </p>
                    <Button
                      tipo="secundario"
                      tamanho="sm"
                      className="mt-2"
                      onClick={() => {
                        onClose();
                        router.push(`/detalhes/${carro.id}`);
                      }}
                    >
                      Ver detalhes
                    </Button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <th
                    scope="row"
                    className="sticky left-0 bg-white z-10 text-left text-xs font-semibold text-fg-subtle p-2 border-t border-slate-100 align-top"
                  >
                    {row.label}
                  </th>
                  {row.values.map((value, i) => (
                    <td
                      key={`${row.label}-${carros[i].id}`}
                      className={`p-2 border-t border-slate-100 align-top ${
                        row.bestIndices.includes(i)
                          ? 'bg-green-50 text-green-700 font-bold rounded-sm'
                          : 'text-fg'
                      }`}
                    >
                      {value}
                      {row.bestIndices.includes(i) && (
                        <span className="sr-only"> (melhor valor)</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[11px] text-fg-subtle mt-3">
            Os valores destacados a verde são os melhores da comparação (menor preço e quilometragem, ano e potência mais altos).
          </p>
        </div>
      )}
    </Modal>
  );
}
