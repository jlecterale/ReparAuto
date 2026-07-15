'use client';

import { Eye, EyeSlash } from '@phosphor-icons/react';
import { useState } from 'react';
import Badge from '@/components/ui/Badge';
import type { BadgeCor } from '@/types/ui';
import type { DamageArea, DamageDetectionResult, DamageSeverity } from '@/types/ia';

interface DamageOverlayProps {
  fotoUrl: string;
  result: DamageDetectionResult;
}

const SEVERITY_LABEL: Record<DamageSeverity, string> = {
  minor: 'Ligeiro',
  moderate: 'Moderado',
  severe: 'Grave',
};

const SEVERITY_BOX: Record<DamageSeverity, string> = {
  minor: 'border-warning-400',
  moderate: 'border-secondary-500',
  severe: 'border-danger-600',
};

const SEVERITY_CHIP: Record<DamageSeverity, string> = {
  minor: 'bg-warning-400 text-fg-strong',
  moderate: 'bg-secondary-500 text-white',
  severe: 'bg-danger-600 text-white',
};

const SEVERITY_BADGE: Record<DamageSeverity, BadgeCor> = {
  minor: 'yellow',
  moderate: 'accent',
  severe: 'red',
};

function boxStyle(area: DamageArea): React.CSSProperties {
  return {
    left: `${area.x * 100}%`,
    top: `${area.y * 100}%`,
    width: `${area.width * 100}%`,
    height: `${area.height * 100}%`,
  };
}

/**
 * Photo with the AI-detected damage boxes drawn on top. Coordinates are
 * fractions of the image, so the wrapper must hug the rendered photo
 * (inline-block + w-full h-auto img) for the boxes to line up.
 */
export default function DamageOverlay({ fotoUrl, result }: DamageOverlayProps) {
  const [showBoxes, setShowBoxes] = useState(true);
  const hasDamages = result.damages.length > 0;

  return (
    <div>
      <div className="relative inline-block w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={fotoUrl} alt="Foto analisada pela IA" className="w-full h-auto rounded-xl" />
        {showBoxes &&
          result.damages.map((area, i) => (
            <div
              key={i}
              className={`absolute border-2 rounded-md ${SEVERITY_BOX[area.severity]} bg-black/5`}
              style={boxStyle(area)}
            >
              <span
                className={`absolute -top-5 left-0 whitespace-nowrap px-1.5 py-0.5 rounded text-[10px] font-semibold ${SEVERITY_CHIP[area.severity]}`}
              >
                {area.label}
              </span>
            </div>
          ))}
        {hasDamages && (
          <button
            onClick={() => setShowBoxes((v) => !v)}
            aria-pressed={showBoxes}
            aria-label={showBoxes ? 'Ocultar marcações de danos' : 'Mostrar marcações de danos'}
            className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/60 hover:bg-black/75 text-fg-inverse text-xs font-semibold transition"
          >
            {showBoxes ? <EyeSlash /> : <Eye />}
            {showBoxes ? 'Ocultar' : 'Mostrar'}
          </button>
        )}
      </div>

      {result.summary && (
        <p className="text-sm text-fg leading-relaxed mt-3">{result.summary}</p>
      )}

      {hasDamages ? (
        <ul className="mt-2 space-y-1.5">
          {result.damages.map((area, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-fg">
              <Badge cor={SEVERITY_BADGE[area.severity]} variante="soft">
                {SEVERITY_LABEL[area.severity]}
              </Badge>
              {area.label}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-fg-muted mt-2">
          Nenhum dano visível identificado nesta fotografia.
        </p>
      )}

      <p className="text-[11px] text-fg-subtle mt-3">
        Resultado gerado por IA — verifique antes de utilizar. As marcações são aproximadas.
      </p>
    </div>
  );
}
