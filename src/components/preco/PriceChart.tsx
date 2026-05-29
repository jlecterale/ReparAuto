'use client';

import { ChartLineUp } from '@phosphor-icons/react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { PriceSnapshot } from '@/types/preco';

interface Props {
  snapshots: PriceSnapshot[];
  height?: number;
}

export default function PriceChart({ snapshots, height = 240 }: Props) {
  if (!snapshots || snapshots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-fg-muted text-sm">
        <ChartLineUp size={32} className="mb-2 text-fg-subtle" />
        <p>Ainda não há histórico de preços para este modelo.</p>
      </div>
    );
  }

  const data = snapshots.map((s) => ({
    data: s.dataCriacao?.toDate?.().toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'short',
    }) ?? '',
    mediana: Math.round(s.median),
    media: Math.round(s.mean),
    minimo: Math.round(s.min),
    maximo: Math.round(s.max),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="data" tick={{ fontSize: 11 }} stroke="#64748b" />
        <YAxis
          tick={{ fontSize: 11 }}
          stroke="#64748b"
          tickFormatter={(v) => `${v.toLocaleString('pt-PT')}€`}
        />
        <Tooltip
          formatter={(v) => `${Number(v).toLocaleString('pt-PT')} €`}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Line type="monotone" dataKey="mediana" name="Mediana" stroke="#e55b2b" strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="media" name="Média" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="minimo" name="Mínimo" stroke="#16a34a" strokeWidth={1} strokeDasharray="3 3" dot={false} />
        <Line type="monotone" dataKey="maximo" name="Máximo" stroke="#dc2626" strokeWidth={1} strokeDasharray="3 3" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
