'use client';

import { MagnifyingGlass, Sparkle } from '@phosphor-icons/react';
import { useState } from 'react';
import useDamageDetection from '@/hooks/useDamageDetection';
import Button from '@/components/ui/Button';
import DamageOverlay from '@/components/detalhes/DamageOverlay';
import type { Carro } from '@/types/carro';

interface DamageAnalysisButtonProps {
  carro: Carro;
  /** AI analysis costs a generation — only signed-in users can trigger it. */
  isAuthenticated: boolean;
}

const isHttpsPhoto = (foto: string) => foto.startsWith('https://');

/**
 * "Análise de danos (IA)" panel for listings flagged as needing maintenance.
 * Lets the viewer pick a photo and runs Gemini Vision on it through the
 * Cloud Function proxy; results are cached per photo in the car document,
 * so repeat analyses are free.
 */
export default function DamageAnalysisButton({ carro, isAuthenticated }: DamageAnalysisButtonProps) {
  const [photoIndex, setPhotoIndex] = useState(() =>
    (carro.fotos ?? []).findIndex(isHttpsPhoto),
  );
  const [analyzedIndex, setAnalyzedIndex] = useState<number | null>(null);
  const { analyze, result, loading, error } = useDamageDetection();

  const fotos = carro.fotos ?? [];
  const analyzablePhotos = fotos.filter(isHttpsPhoto);
  if (analyzablePhotos.length === 0 || photoIndex < 0) return null;

  const selectedUrl = fotos[photoIndex];
  const resultMatchesPhoto = result !== null && analyzedIndex === photoIndex && !loading;

  const handleAnalyze = async () => {
    const detection = await analyze(carro.id, photoIndex);
    if (detection) setAnalyzedIndex(photoIndex);
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
      <h3 className="font-extrabold text-fg-heading mb-1 flex items-center gap-2">
        <Sparkle weight="fill" className="text-accent" /> Análise de danos (IA)
      </h3>
      <p className="text-xs text-fg-muted mb-3">
        A IA identifica danos visíveis nas fotos deste veículo e marca-os na imagem.
      </p>

      {analyzablePhotos.length > 1 && (
        <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide">
          {fotos.map((foto, i) =>
            isHttpsPhoto(foto) ? (
              <button
                key={i}
                onClick={() => setPhotoIndex(i)}
                aria-label={`Analisar foto ${i + 1}`}
                aria-current={i === photoIndex ? 'true' : undefined}
                className={`w-14 h-14 rounded-lg overflow-hidden border-2 shrink-0 transition ${
                  i === photoIndex ? 'border-accent' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={foto} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ) : null,
          )}
        </div>
      )}

      {resultMatchesPhoto ? (
        <DamageOverlay fotoUrl={selectedUrl} result={result} />
      ) : (
        <Button
          tipo="primario"
          tamanho="sm"
          icone={<MagnifyingGlass />}
          onClick={handleAnalyze}
          disabled={!isAuthenticated}
          carregando={loading}
          className="bg-gradient-to-r from-primary-600 to-accent hover:from-primary-700 hover:to-accent-hover"
        >
          {loading ? 'A analisar a foto…' : 'Analisar danos desta foto'}
        </Button>
      )}

      {!isAuthenticated && (
        <p className="text-[11px] text-fg-subtle mt-2">
          Inicie sessão para usar a análise de danos com IA.
        </p>
      )}
      {error && <p className="text-xs text-danger-600 mt-2">{error}</p>}
    </div>
  );
}
