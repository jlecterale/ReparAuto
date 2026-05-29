'use client';

import { useMemo, useState } from 'react';
import useMarketStats from '@/hooks/useMarketStats';
import { useApp } from '@/providers/AppProvider';
import { formatarPreco } from '@/lib/utils';
import { TIPOS_COMBUSTIVEL } from '@/lib/constants';
import marcasModelos from '@/data/marcas-modelos.json';
import PriceDistribution from '@/components/preco/PriceDistribution';

interface MarcaModelo {
  marca: string;
  modelos: string[];
}

export default function MarketDashboard() {
  const { carros: carrosCtx } = useApp();
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [combustivel, setCombustivel] = useState('');
  const [anoMin, setAnoMin] = useState<string>('');
  const [anoMax, setAnoMax] = useState<string>('');

  const lista = marcasModelos as MarcaModelo[];
  const marcas = useMemo(() => lista.map((m) => m.marca).sort(), [lista]);
  const modelos = useMemo(() => lista.find((m) => m.marca === marca)?.modelos ?? [], [lista, marca]);

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
      <div className="bg-white rounded-2xl shadow-md p-5">
        <h2 className="font-extrabold text-brand-900 mb-3 flex items-center gap-2">
          <i className="fa-solid fa-filter text-accent"></i> Filtros
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <select
            value={marca}
            onChange={(e) => { setMarca(e.target.value); setModelo(''); }}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            <option value="">Todas as marcas</option>
            {marcas.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select
            value={modelo}
            onChange={(e) => setModelo(e.target.value)}
            disabled={!marca}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-100"
          >
            <option value="">Todos os modelos</option>
            {modelos.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select
            value={combustivel}
            onChange={(e) => setCombustivel(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            <option value="">Combustível</option>
            {TIPOS_COMBUSTIVEL.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input
            type="number"
            placeholder="Ano min"
            value={anoMin}
            onChange={(e) => setAnoMin(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
          <input
            type="number"
            placeholder="Ano máx"
            value={anoMax}
            onChange={(e) => setAnoMax(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Anúncios" value={stats ? String(stats.count) : '0'} icon="fa-solid fa-list" />
        <StatCard
          label="Mediana"
          value={stats ? formatarPreco(stats.median) : '—'}
          icon="fa-solid fa-equals"
          accent
        />
        <StatCard label="Média" value={stats ? formatarPreco(Math.round(stats.mean)) : '—'} icon="fa-solid fa-calculator" />
        <StatCard
          label="Intervalo P25–P75"
          value={stats ? `${formatarPreco(stats.p25)} – ${formatarPreco(stats.p75)}` : '—'}
          icon="fa-solid fa-arrows-left-right"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-md p-5">
        <h3 className="font-extrabold text-brand-900 mb-3 flex items-center gap-2">
          <i className="fa-solid fa-chart-column text-accent"></i>
          Distribuição de preços
        </h3>
        <PriceDistribution precos={carros.map((c) => c.preco)} />
      </div>

      {!marca && (
        <div className="bg-white rounded-2xl shadow-md p-5">
          <h3 className="font-extrabold text-brand-900 mb-3 flex items-center gap-2">
            <i className="fa-solid fa-trophy text-accent"></i> Marcas mais anunciadas
          </h3>
          <div className="divide-y divide-slate-100">
            {topMarcas.map((m) => (
              <div key={m.marca} className="flex items-center justify-between py-2 text-sm">
                <span className="font-semibold text-slate-700">{m.marca}</span>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>{m.count} {m.count === 1 ? 'anúncio' : 'anúncios'}</span>
                  <span className="font-bold text-brand-900">{formatarPreco(Math.round(m.media))}</span>
                </div>
              </div>
            ))}
            {topMarcas.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">Sem dados disponíveis.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-4 shadow-sm border ${
        accent ? 'bg-accent text-white border-accent' : 'bg-white text-brand-900 border-slate-100'
      }`}
    >
      <div className={`text-[10px] uppercase tracking-wide ${accent ? 'text-white/80' : 'text-slate-500'}`}>
        <i className={`${icon} mr-1`}></i>
        {label}
      </div>
      <div className={`text-lg font-extrabold mt-1 ${accent ? 'text-white' : 'text-brand-900'}`}>
        {value}
      </div>
    </div>
  );
}
