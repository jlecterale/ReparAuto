'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, ChatCircle, Heart, ArrowsDownUp, Car, GearSix, Warning } from '@phosphor-icons/react';
import Badge from '@/components/ui/Badge';
import { formatarPreco } from '@/lib/utils';
import { docCountry, type Country } from '@/lib/country';
import type { Carro } from '@/types/carro';
import type { Peca } from '@/types/peca';

interface Props {
  carros: Carro[];
  pecas: Peca[];
}

type Row = {
  id: string;
  tipo: 'carro' | 'peca';
  titulo: string;
  preco?: number;
  status: string;
  views: number;
  mensagens: number;
  favoritos: number;
  href: string;
  country: Country;
};


type SortKey = 'views' | 'mensagens' | 'favoritos';

const STATUS_COR: Record<string, 'green' | 'yellow' | 'gray'> = {
  aprovado: 'green',
  pendente: 'yellow',
  rejeitado: 'gray',
};

const STATUS_LABEL: Record<string, string> = {
  aprovado: 'Ativo',
  pendente: 'Pendente',
  rejeitado: 'Rejeitado',
};

export default function InventoryPerformanceTable({ carros, pecas }: Props) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey>('views');

  const rows = useMemo<Row[]>(() => {
    const carRows: Row[] = carros.map((c) => ({
      id: c.id,
      tipo: 'carro',
      titulo: `${c.marca} ${c.modelo}`,
      preco: c.preco,
      status: c.status,
      views: c.visualizacoes || 0,
      mensagens: c.contagemMensagens || 0,
      favoritos: c.contagemFavoritos || 0,
      href: `/detalhes/${c.id}`,
      country: docCountry(c),
    }));
    const pecaRows: Row[] = pecas.map((p) => ({
      id: p.id,
      tipo: 'peca',
      titulo: p.titulo || `${p.categoria || 'Peça'}`,
      preco: p.preco ?? undefined,
      status: p.status,
      views: p.visualizacoes || 0,
      mensagens: p.contagemMensagens || 0,
      favoritos: 0,
      href: `/pecas/${p.id}`,
      country: docCountry(p),
    }));
    return [...carRows, ...pecaRows].sort((a, b) => b[sortKey] - a[sortKey]);
  }, [carros, pecas, sortKey]);

  const SortButton = ({ k, label }: { k: SortKey; label: React.ReactNode }) => (
    <button
      onClick={() => setSortKey(k)}
      className={`inline-flex items-center gap-1 font-semibold transition ${
        sortKey === k ? 'text-accent' : 'text-fg-muted hover:text-fg'
      }`}
      aria-pressed={sortKey === k}
    >
      {label}
      <ArrowsDownUp size={12} />
    </button>
  );

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 flex flex-col items-center justify-center text-center py-16 text-fg-muted">
        <Car size={40} className="mb-3 text-neutral-300" />
        <p className="font-semibold text-fg">Ainda não tem anúncios publicados.</p>
        <p className="text-sm">Publique o seu primeiro anúncio para começar a ver o desempenho aqui.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 text-left text-xs">
              <th className="px-4 py-3 font-semibold text-fg-muted">Anúncio</th>
              <th className="px-3 py-3 text-right"><SortButton k="views" label={<Eye />} /></th>
              <th className="px-3 py-3 text-right"><SortButton k="mensagens" label={<ChatCircle />} /></th>
              <th className="px-3 py-3 text-right"><SortButton k="favoritos" label={<Heart />} /></th>
              <th className="px-4 py-3 font-semibold text-fg-muted text-right">Estado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const stale = r.status === 'aprovado' && r.views >= 25 && r.mensagens === 0;
              return (
                <tr
                  key={`${r.tipo}-${r.id}`}
                  onClick={() => router.push(r.href)}
                  className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50 cursor-pointer transition"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {r.tipo === 'carro' ? (
                        <Car className="text-fg-subtle shrink-0" />
                      ) : (
                        <GearSix className="text-fg-subtle shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-fg truncate">{r.titulo}</p>
                        <div className="flex items-center gap-2">
                          {r.preco != null && (
                            <span className="text-xs text-fg-muted">{formatarPreco(r.preco, r.country)}</span>
                          )}
                          {stale && (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-warning-700"
                              title="Muitas visitas, nenhum contacto — reveja preço e fotos."
                            >
                              <Warning weight="fill" /> Sem contactos
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right font-semibold tabular-nums text-fg">{r.views}</td>
                  <td className="px-3 py-3 text-right font-semibold tabular-nums text-fg">{r.mensagens}</td>
                  <td className="px-3 py-3 text-right font-semibold tabular-nums text-fg">
                    {r.tipo === 'carro' ? r.favoritos : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Badge cor={STATUS_COR[r.status] || 'gray'} variante="soft">
                      {STATUS_LABEL[r.status] || r.status}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
