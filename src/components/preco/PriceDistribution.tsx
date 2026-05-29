'use client';

import { ChartBar } from '@phosphor-icons/react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { priceDistributionBuckets } from '@/lib/priceUtils';

interface Props {
  precos: number[];
  height?: number;
  bucketCount?: number;
}

export default function PriceDistribution({ precos, height = 220, bucketCount = 8 }: Props) {
  const data = priceDistributionBuckets(precos, bucketCount);

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-fg-muted text-sm">
        <ChartBar size={32} className="mb-2 text-fg-subtle" />
        <p>Não há anúncios suficientes para mostrar a distribuição.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="#64748b" interval={0} angle={-25} textAnchor="end" height={60} />
        <YAxis tick={{ fontSize: 11 }} stroke="#64748b" allowDecimals={false} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
          formatter={(v) => {
            const n = Number(v);
            return [`${n} anúncio${n === 1 ? '' : 's'}`, 'Quantidade'];
          }}
        />
        <Bar dataKey="count" fill="#e55b2b" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
