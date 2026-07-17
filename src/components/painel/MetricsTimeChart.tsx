'use client';

import { useMemo } from 'react';
import { Eye, ChatCircle } from '@phosphor-icons/react';
import type { MetricPoint } from '@/types/dashboard';

interface Props {
  points: MetricPoint[];
}

const W = 720;
const H = 240;
const PAD = { top: 16, right: 16, bottom: 28, left: 32 };

function buildPath(values: number[], max: number): string {
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const step = values.length > 1 ? innerW / (values.length - 1) : 0;
  return values
    .map((v, i) => {
      const x = PAD.left + i * step;
      const y = PAD.top + innerH - (max > 0 ? (v / max) * innerH : 0);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

function formatDate(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

export default function MetricsTimeChart({ points }: Props) {
  const { viewsPath, contactsPath, viewsArea, max, totalViews, totalContacts } = useMemo(() => {
    const views = points.map((p) => p.views);
    const contacts = points.map((p) => p.contacts);
    const maxVal = Math.max(1, ...views, ...contacts);
    const innerH = H - PAD.top - PAD.bottom;
    const vPath = buildPath(views, maxVal);
    const cPath = buildPath(contacts, maxVal);
    const baseY = PAD.top + innerH;
    const firstX = PAD.left;
    const lastX = W - PAD.right;
    const area = `${vPath} L${lastX.toFixed(1)},${baseY} L${firstX.toFixed(1)},${baseY} Z`;
    return {
      viewsPath: vPath,
      contactsPath: cPath,
      viewsArea: area,
      max: maxVal,
      totalViews: views.reduce((a, b) => a + b, 0),
      totalContacts: contacts.reduce((a, b) => a + b, 0),
    };
  }, [points]);

  const isEmpty = totalViews === 0 && totalContacts === 0;
  const labels = points.length
    ? [points[0].date, points[Math.floor(points.length / 2)].date, points[points.length - 1].date]
    : [];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="font-extrabold text-fg-heading text-base">Evolução do interesse</h3>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="inline-flex items-center gap-1.5 text-accent">
            <Eye weight="fill" /> Visualizações
          </span>
          <span className="inline-flex items-center gap-1.5 text-primary-600">
            <ChatCircle weight="fill" /> Contactos
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Gráfico de evolução: ${totalViews} visualizações e ${totalContacts} contactos no período.`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* horizontal gridlines + y labels (0, mid, max) */}
        {[0, 0.5, 1].map((t) => {
          const innerH = H - PAD.top - PAD.bottom;
          const y = PAD.top + innerH - t * innerH;
          const val = Math.round(max * t);
          return (
            <g key={t}>
              <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} className="stroke-neutral-100" strokeWidth={1} />
              <text x={4} y={y + 4} className="fill-neutral-400" fontSize={11}>
                {val}
              </text>
            </g>
          );
        })}

        {!isEmpty && (
          <>
            <path d={viewsArea} className="fill-accent/10" />
            <path d={viewsPath} className="stroke-accent" strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
            <path d={contactsPath} className="stroke-primary-600" strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          </>
        )}

        {/* x labels */}
        {labels.map((iso, i) => {
          const x = i === 0 ? PAD.left : i === 1 ? W / 2 : W - PAD.right;
          const anchor = i === 0 ? 'start' : i === 1 ? 'middle' : 'end';
          return (
            <text key={iso} x={x} y={H - 8} textAnchor={anchor} className="fill-neutral-400" fontSize={11}>
              {formatDate(iso)}
            </text>
          );
        })}
      </svg>

      {isEmpty && (
        <p className="text-center text-sm text-fg-muted -mt-8 mb-6 relative">
          Ainda sem dados de interesse neste período. Os números aparecem à medida que recebe visitas e contactos.
        </p>
      )}
    </div>
  );
}
