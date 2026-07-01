'use client';

import { useMemo, useState } from 'react';
import {
  ArrowsLeftRight,
  Calculator,
  ChartBar,
  Equals,
  Funnel,
  ListBullets,
  Trophy,
  type Icon,
} from '@phosphor-icons/react';
import useMarketStats from '@/hooks/useMarketStats';
import { useApp } from '@/providers/AppProvider';
import { formatarPreco } from '@/lib/utils';
import { PRICE_DISCLAIMERS, TIPOS_COMBUSTIVEL } from '@/lib/constants';
import BrandModelSelect from '@/components/preco/BrandModelSelect';
import PriceDistribution from '@/components/preco/PriceDistribution';

const fieldClass =
  'px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30';

export default function MarketDashboard() {
  const { carros: carrosCtx } = useApp();
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [combustivel, setCombustivel] = useState('');
  const [anoMin, setAnoMin] = useState<string>('');
  const [anoMax, setAnoMax] = useState<string>('');

  const filtro = {
    marca: marca || undefined,
    modelo: modelo || undefined,
    combustivel: combustivel || undefined,
    anoMin: anoMin ? Number(anoMin) : undefined,
    anoMax: anoMax ? Number(anoMax) : undefined,
  };

  const { stats, carros } = useMarketStats(filtro);

  const topMarcas = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    for (const c of carrosCtx.carros) {
      // Keep "Para peças" listings out of the average-price ranking, same as
      // useMarketStats — they'd drag brand averages toward salvage prices.
      if (c.condition === 'Para peças') continue;
      const cur = map.get(c.marca) ?? { count: 0, total: 0 };
      cur.count++;
      cur.total += c.preco;
      map.set(c.marca, cur);
    }
    return Array.from(map.entries())
      .map(([m, v]) => ({ marca: m, count: v.count, media: v.total / v.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [carrosCtx.carros]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-5">
        <h2 className="font-extrabold text-fg-heading mb-3 flex items-center gap-2">
          <Funnel className="text-accent" /> Filtros
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end">
          <BrandModelSelect
            marca={marca}
            modelo={modelo}
            onMarcaChange={setMarca}
            onModeloChange={setModelo}
            marcaLabel="Marca"
            modeloLabel="Modelo"
            marcaPlaceholder="Todas as marcas"
            modeloPlaceholder="Todos os modelos"
          />
          <select
            aria-label="Combustível"
            value={combustivel}
            onChange={(e) => setCombustivel(e.target.value)}
            className={fieldClass}
          >
            <option value="">Combustível</option>
            {TIPOS_COMBUSTIVEL.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input
            type="number"
            aria-label="Ano mínimo"
            placeholder="Ano mín."
            value={anoMin}
            onChange={(e) => setAnoMin(e.target.value)}
            className={fieldClass}
          />
          <input
            type="number"
            aria-label="Ano máximo"
            placeholder="Ano máx."
            value={anoMax}
            onChange={(e) => setAnoMax(e.target.value)}
            className={fieldClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Anúncios" value={stats ? String(stats.count) : '0'} IconEl={ListBullets} />
        <StatCard
          label="Mediana"
          value={stats ? formatarPreco(stats.median) : '—'}
          IconEl={Equals}
          accent
        />
        <StatCard
          label="Média"
          value={stats ? formatarPreco(Math.round(stats.mean)) : '—'}
          IconEl={Calculator}
        />
        <StatCard
          label="Intervalo P25–P75"
          value={stats ? `${formatarPreco(stats.p25)} – ${formatarPreco(stats.p75)}` : '—'}
          IconEl={ArrowsLeftRight}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-5">
        <h3 className="font-extrabold text-fg-heading mb-3 flex items-center gap-2">
          <ChartBar className="text-accent" /> Distribuição de preços
        </h3>
        <PriceDistribution precos={carros.map((c) => c.preco)} />
      </div>

      {!marca && (
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-5">
          <h3 className="font-extrabold text-fg-heading mb-3 flex items-center gap-2">
            <Trophy className="text-accent" /> Marcas mais anunciadas
          </h3>
          <div className="divide-y divide-neutral-200">
            {topMarcas.map((m) => (
              <div key={m.marca} className="flex items-center justify-between py-2 text-sm">
                <span className="font-semibold text-fg-strong">{m.marca}</span>
                <div className="flex items-center gap-4 text-xs text-fg-muted">
                  <span>{m.count} {m.count === 1 ? 'anúncio' : 'anúncios'}</span>
                  <span className="font-bold text-fg-heading">{formatarPreco(Math.round(m.media))}</span>
                </div>
              </div>
            ))}
            {topMarcas.length === 0 && (
              <p className="text-sm text-fg-muted text-center py-4">Sem dados disponíveis.</p>
            )}
          </div>
        </div>
      )}

      <p className="text-[10px] text-fg-muted text-center px-4">{PRICE_DISCLAIMERS.market}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  IconEl,
  accent,
}: {
  label: string;
  value: string;
  IconEl: Icon;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-4 shadow-sm border ${
        accent ? 'bg-accent text-fg-inverse border-accent' : 'bg-white text-fg-heading border-neutral-200'
      }`}
    >
      <div className={`text-[10px] uppercase tracking-wide flex items-center gap-1 ${accent ? 'text-white/80' : 'text-fg-muted'}`}>
        <IconEl size={12} />
        {label}
      </div>
      <div className={`text-lg font-extrabold mt-1 ${accent ? 'text-white' : 'text-fg-heading'}`}>
        {value}
      </div>
    </div>
  );
}
