'use client';

import { useEffect, useState } from 'react';
import CameraCapture from '@/components/ui/CameraCapture';
import { LISTING_PHOTO_ASPECT } from '@/lib/constants';
import {
  getCaptureSequence,
  REQUIRED_SPIN_ANGLES,
  SPIN_ANGLE_DEGREES,
  SPIN_ANGLE_LABELS,
  type SpinAngle,
} from '@/lib/spin360';

interface GuidedSpinCaptureProps {
  /** Current form tags — angles already photographed are skipped. */
  angleByPhoto: Record<string, SpinAngle>;
  /** How many photos can still be added to the listing. */
  remainingSlots: number;
  onCapture: (file: File, angle: SpinAngle) => void;
  onClose: () => void;
}

/** Top-view diagram showing where to stand relative to the vehicle. */
function CapturePositionDiagram({ angle }: { angle: SpinAngle }) {
  const rad = (SPIN_ANGLE_DEGREES[angle] * Math.PI) / 180;
  const cx = 48 + 34 * Math.sin(rad);
  const cy = 48 - 34 * Math.cos(rad);
  return (
    <svg viewBox="0 0 96 96" className="w-20 h-20" aria-hidden="true">
      {/* Walk-around ring */}
      <circle cx="48" cy="48" r="34" className="stroke-white/30" strokeWidth="1.5" strokeDasharray="3 4" fill="none" />
      {/* Vehicle, top view, nose up */}
      <rect x="36" y="26" width="24" height="44" rx="9" className="fill-white/25 stroke-white/70" strokeWidth="1.5" />
      <rect x="39" y="36" width="18" height="9" rx="3" className="fill-white/50" />
      {/* Camera position */}
      <g className="text-accent">
        <circle cx={cx} cy={cy} r="6.5" fill="currentColor" />
        <circle cx={cx} cy={cy} r="10" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      </g>
    </svg>
  );
}

/**
 * Guided 360 capture: walks the seller around the vehicle, one missing angle
 * at a time, with a framing overlay ("moldura") on the live camera. Each shot
 * is cropped to the listing aspect and auto-tagged with its angle.
 */
export default function GuidedSpinCapture({
  angleByPhoto,
  remainingSlots,
  onCapture,
  onClose,
}: GuidedSpinCaptureProps) {
  // The tour is frozen when it opens; skipped angles are not re-offered.
  const [sequence] = useState(() => getCaptureSequence(angleByPhoto));
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (remainingSlots <= 0 || step >= sequence.length) onClose();
  }, [remainingSlots, step, sequence.length, onClose]);

  const angle = sequence[step];
  if (!angle || remainingSlots <= 0) return null;

  const isRequired = REQUIRED_SPIN_ANGLES.includes(angle);

  const overlay = (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {/* Framing guide matching the captured 4:3 area */}
      <div className="relative w-full aspect-[4/3] max-h-full border-2 border-dashed border-white/50 rounded-xl">
        <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-2">
          <div className="bg-black/55 rounded-lg px-2.5 py-1.5">
            <p className="text-white text-sm font-extrabold">{SPIN_ANGLE_LABELS[angle]}</p>
            <p className="text-white/70 text-[10px] font-semibold">
              {step + 1}/{sequence.length} · {isRequired ? 'Necessário para o 360°' : 'Opcional'}
            </p>
          </div>
          <CapturePositionDiagram angle={angle} />
        </div>
        <p className="absolute bottom-11 left-1/2 -translate-x-1/2 w-max max-w-full text-white/80 text-[11px] font-semibold bg-black/45 px-2.5 py-1 rounded-full">
          Enquadre o veículo inteiro na moldura
        </p>
        <button
          type="button"
          onClick={() => setStep((s) => s + 1)}
          className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-auto text-white text-xs font-bold bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-full transition"
        >
          {step + 1 >= sequence.length ? 'Concluir' : 'Saltar este ângulo →'}
        </button>
      </div>
    </div>
  );

  return (
    <CameraCapture
      label={`Captura guiada 360° — ${SPIN_ANGLE_LABELS[angle]}`}
      overlay={overlay}
      cropAspect={LISTING_PHOTO_ASPECT}
      keepOpenAfterCapture
      onCapture={(file) => {
        onCapture(file, angle);
        setStep((s) => s + 1);
      }}
      onClose={onClose}
    />
  );
}
