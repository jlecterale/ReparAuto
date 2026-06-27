'use client';

import { useState } from 'react';

interface PortugalMapProps {
  userCountsByDistrict: Record<string, number>;
}

const DISTRICTS = [
  { id: 'Viana do Castelo', name: 'Viana do Castelo', points: '45,10 65,10 65,35 45,35' },
  { id: 'Braga', name: 'Braga', points: '65,10 85,10 85,35 65,35' },
  { id: 'Vila Real', name: 'Vila Real', points: '85,10 115,10 115,35 85,35' },
  { id: 'Bragança', name: 'Bragança', points: '115,10 155,10 155,45 115,45' },
  { id: 'Porto', name: 'Porto', points: '45,35 85,35 85,60 45,60' },
  { id: 'Viseu', name: 'Viseu', points: '85,35 115,35 115,70 85,70' },
  { id: 'Guarda', name: 'Guarda', points: '115,45 155,45 155,90 115,90' },
  { id: 'Aveiro', name: 'Aveiro', points: '40,60 75,60 75,95 40,95' },
  { id: 'Coimbra', name: 'Coimbra', points: '75,60 115,70 105,115 75,95' },
  { id: 'Castelo Branco', name: 'Castelo Branco', points: '115,90 155,90 135,145 105,115' },
  { id: 'Leiria', name: 'Leiria', points: '30,95 70,95 65,145 30,135' },
  { id: 'Santarém', name: 'Santarém', points: '70,95 105,115 95,185 55,185' },
  { id: 'Portalegre', name: 'Portalegre', points: '105,115 135,145 125,190 95,185' },
  { id: 'Lisboa', name: 'Lisboa', points: '15,135 55,145 45,215 15,195' },
  { id: 'Setúbal', name: 'Setúbal', points: '35,215 70,215 60,285 25,275' },
  { id: 'Évora', name: 'Évora', points: '70,215 125,190 115,270 60,285' },
  { id: 'Beja', name: 'Beja', points: '25,275 115,270 105,345 15,335' },
  { id: 'Faro', name: 'Faro', points: '15,335 105,345 95,375 10,365' }
];

export default function PortugalMap({ userCountsByDistrict }: PortugalMapProps) {
  const [hovered, setHovered] = useState<{ id: string; name: string; count: number; x: number; y: number } | null>(null);

  // Find max count to scale gradients
  const counts = Object.values(userCountsByDistrict);
  const maxCount = counts.length > 0 ? Math.max(...counts, 1) : 1;

  const handleMouseMove = (e: React.MouseEvent<SVGPolygonElement>, id: string, name: string) => {
    const rect = e.currentTarget.parentElement?.getBoundingClientRect();
    if (!rect) return;
    const count = userCountsByDistrict[id] || 0;
    
    // Position tooltip relative to container bounds
    const x = e.clientX - rect.left + 15;
    const y = e.clientY - rect.top - 25;
    
    setHovered({ id, name, count, x, y });
  };

  const handleMouseLeave = () => {
    setHovered(null);
  };

  return (
    <div className="relative w-full h-[400px] bg-white rounded-2xl border border-neutral-200 p-4 flex flex-col items-center justify-between">
      <div className="w-full flex justify-between items-start mb-2">
        <div>
          <h3 className="text-sm font-bold text-fg-heading">Distribuição</h3>
          <p className="text-[10px] text-fg-muted">Densidade de Utilizadores por Distrito</p>
        </div>
        <div className="flex gap-2 text-[10px] text-fg-muted">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-slate-100 border border-neutral-300 rounded-sm inline-block" />
            <span>0</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-pink-500/30 rounded-sm inline-block" />
            <span>Pouco</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-pink-500 rounded-sm inline-block" />
            <span>Muito</span>
          </div>
        </div>
      </div>

      <div className="relative flex-1 w-full flex items-center justify-center">
        <svg viewBox="0 0 170 390" className="h-full max-h-[330px] w-auto drop-shadow-[0_0_15px_rgba(244,63,94,0.15)]">
          {DISTRICTS.map((dist) => {
            const count = userCountsByDistrict[dist.id] || 0;
            const maxOpacity = 0.5 + (count / maxCount) * 0.5; // min 50% opacity for active districts
            const isHovered = hovered?.id === dist.id;

            return (
              <polygon
                key={dist.id}
                points={dist.points}
                className="transition-all duration-200 cursor-pointer"
                style={{
                  fill: count > 0 ? `rgba(244, 63, 94, ${maxOpacity})` : 'rgba(148, 163, 184, 0.25)',
                  strokeWidth: isHovered ? 2 : 1,
                  stroke: isHovered ? '#f43f5e' : count > 0 ? 'rgba(244, 63, 94, 0.6)' : 'rgba(148, 163, 184, 0.3)',
                  filter: isHovered ? 'drop-shadow(0 0 4px rgba(244,63,94,0.5))' : 'none'
                }}
                onMouseMove={(e) => handleMouseMove(e, dist.id, dist.name)}
                onMouseLeave={handleMouseLeave}
              />
            );
          })}
        </svg>

        {hovered && (
          <div
            className="absolute z-10 pointer-events-none bg-white border border-neutral-200 text-fg text-xs font-bold rounded-lg px-2.5 py-1.5 shadow-xl flex flex-col gap-0.5"
            style={{ left: hovered.x, top: hovered.y }}
          >
            <span className="text-fg-heading">{hovered.name}</span>
            <span className="text-pink-700 text-[10px] font-extrabold">
              {hovered.count} {hovered.count === 1 ? 'Utilizador' : 'Utilizadores'}
            </span>
          </div>
        )}
      </div>

      <div className="w-full grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-neutral-200">
        <div className="bg-white rounded-xl p-2 text-center border border-neutral-200">
          <p className="text-xs font-black text-fg-heading">
            {Object.keys(userCountsByDistrict).filter(k => k !== 'Não Especificado' && userCountsByDistrict[k] > 0).length}
          </p>
          <p className="text-[9px] text-fg-muted font-bold uppercase tracking-wider">Distritos Ativos</p>
        </div>
        <div className="bg-white rounded-xl p-2 text-center border border-neutral-200">
          <p className="text-xs font-black text-pink-700">
            {maxCount === 1 && counts.length === 0 ? 0 : maxCount}
          </p>
          <p className="text-[9px] text-fg-muted font-bold uppercase tracking-wider">Pico / Distrito</p>
        </div>
      </div>
    </div>
  );
}
