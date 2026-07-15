'use client';

import { Clock, PaperPlaneTilt, Star, WarningCircle } from '@phosphor-icons/react';
import Button from '@/components/ui/Button';
import { useState, useEffect, useCallback } from 'react';
import Alert from '@/components/ui/Alert';
import { contemProfanity } from '@/lib/profanity';
import { getCriteriosPorTipo } from '@/lib/reviewUtils';
import type { ReviewInput, ReviewCriterio, Review } from '@/types/review';
import type { EspecialidadeOficina } from '@/types/oficina';

interface ReviewFormStructuredProps {
  autorUid: string;
  autorNome: string;
  autorFoto: string | null;
  vendedorUid: string;
  vendedorEmail: string;
  anuncioId: string;
  anuncioTipo: 'carro' | 'peca' | 'oficina';
  /** For workshops — extra criteria derived from their specialties */
  especialidades?: EspecialidadeOficina[];
  /** If provided, form starts in "edit" mode pre‑filled with existing review */
  existingReview?: Review;
  onSubmit: (data: ReviewInput) => Promise<unknown>;
  /** Called when editing an existing review */
  onUpdate?: (data: Partial<ReviewInput>) => Promise<unknown>;
}

const LABEL_NOTAS: Record<number, string> = {
  1: 'Mau',
  2: 'Razoável',
  3: 'Bom',
  4: 'Muito Bom',
  5: 'Excelente',
};

export default function ReviewFormStructured({
  autorUid,
  autorNome,
  autorFoto,
  vendedorUid,
  vendedorEmail,
  anuncioId,
  anuncioTipo,
  especialidades,
  existingReview,
  onSubmit,
  onUpdate,
}: ReviewFormStructuredProps) {
  const isEditing = !!existingReview;

  // Build the criteria list — if editing, use existing; otherwise generate defaults
  const buildCriterios = useCallback((): ReviewCriterio[] => {
    if (existingReview?.criterios && existingReview.criterios.length > 0) {
      return existingReview.criterios.map((c) => ({ ...c }));
    }
    return getCriteriosPorTipo(anuncioTipo, especialidades);
  }, [existingReview, anuncioTipo, especialidades]);

  const [criterios, setCriterios] = useState<ReviewCriterio[]>(() => buildCriterios());
  const [comentario, setComentario] = useState(existingReview?.comentario ?? '');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');

  // Re‑build if existingReview changes (e.g. loaded async)
  useEffect(() => {
    setCriterios(buildCriterios());
    if (existingReview) {
      setComentario(existingReview.comentario ?? '');
    }
  }, [buildCriterios, existingReview]);

  const handleNotaChange = (chave: string, valor: number) => {
    setCriterios((prev) =>
      prev.map((c) => (c.chave === chave ? { ...c, nota: valor } : c)),
    );
  };

  const allRated = criterios.every((c) => c.nota > 0);

  const handleSubmit = async () => {
    if (!allRated) return;
    const comentarioTrim = comentario.trim();
    if (comentarioTrim && contemProfanity(comentarioTrim)) {
      setErro('O comentário contém linguagem inapropriada. Por favor, remova esses termos.');
      return;
    }

    setEnviando(true);
    setErro('');

    try {
      const notaMedia =
        Math.round(
          (criterios.reduce((s, c) => s + c.nota, 0) / criterios.length) * 10,
        ) / 10;

      const input: ReviewInput = {
        autorUid,
        autorNome,
        autorFoto,
        vendedorUid,
        vendedorEmail,
        anuncioId,
        anuncioTipo,
        criterios,
        nota: notaMedia,
        comentario: comentarioTrim,
      };

      if (isEditing && onUpdate) {
        await onUpdate(input);
      } else {
        await onSubmit(input);
      }

      setEnviado(true);
    } catch (err) {
      if (err instanceof Error) {
        setErro(err.message);
      } else {
        setErro('Erro ao enviar avaliação. Tente novamente.');
      }
    } finally {
      setEnviando(false);
    }
  };

  if (enviado) {
    return (
      <Alert
        tipo={isEditing ? 'sucesso' : 'aviso'}
        align="center"
        icone={<Clock />}
        titulo={isEditing ? 'Avaliação actualizada!' : 'Avaliação enviada!'}
      >
        {isEditing
          ? 'A sua avaliação foi actualizada e será re‑avaliada pela equipa RecarGarage.'
          : 'A sua avaliação será visível após aprovação pela equipa RecarGarage.'}
      </Alert>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
      <h4 className="font-bold text-fg-heading text-sm mb-3 flex items-center gap-1.5">
        <Star className="text-yellow-500" />
        {isEditing ? 'Editar Avaliação' : 'Avaliar'}
      </h4>

      {/* Criteria ratings */}
      <div className="space-y-3 mb-4">
        {criterios.map((criterio) => (
          <div key={criterio.chave}>
            <p className="text-xs font-semibold text-fg mb-1">{criterio.rotulo}</p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  aria-label={`${criterio.rotulo}: ${star} de 5 estrelas`}
                  onClick={() => handleNotaChange(criterio.chave, star)}
                  className="text-lg transition-transform hover:scale-110 cursor-pointer"
                >
                  <Star
                    weight={star <= criterio.nota ? 'fill' : 'regular'}
                    className={
                      star <= criterio.nota ? 'text-yellow-500' : 'text-slate-300'
                    }
                  />
                </button>
              ))}
              {criterio.nota > 0 && (
                <span className="text-[10px] text-fg-subtle ml-1 font-semibold">
                  {LABEL_NOTAS[criterio.nota]}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Comments */}
      <textarea
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        placeholder="Escreva um comentário sobre a sua experiência... (opcional)"
        className="w-full border border-slate-300 rounded-lg p-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
        maxLength={500}
      />

      {erro && (
        <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
          <WarningCircle /> {erro}
        </p>
      )}

      <div className="flex items-center justify-between mt-3">
        <span className="text-[10px] text-fg-subtle">{comentario.length}/500</span>
        <Button
          tipo="primario"
          tamanho="sm"
          carregando={enviando}
          disabled={!allRated || enviando}
          onClick={handleSubmit}
          icone={<PaperPlaneTilt />}
        >
          {enviando
            ? 'A enviar...'
            : isEditing
              ? 'Actualizar Avaliação'
              : 'Enviar Avaliação'}
        </Button>
      </div>
    </div>
  );
}
