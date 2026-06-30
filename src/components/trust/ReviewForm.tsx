'use client';

import { Clock, PaperPlaneTilt, Star, StarHalf, WarningCircle } from '@phosphor-icons/react';
import Button from '@/components/ui/Button';
import { useState } from 'react';
import Alert from '@/components/ui/Alert';
import { contemProfanity } from '@/lib/profanity';
import type { ReviewInput } from '@/types/review';

interface ReviewFormProps {
  autorUid: string;
  autorNome: string;
  autorFoto: string | null;
  vendedorUid: string;
  vendedorEmail: string;
  anuncioId: string;
  anuncioTipo: 'carro' | 'peca';
  onSubmit: (data: ReviewInput) => Promise<unknown>;
}

export default function ReviewForm({
  autorUid,
  autorNome,
  autorFoto,
  vendedorUid,
  vendedorEmail,
  anuncioId,
  anuncioTipo,
  onSubmit,
}: ReviewFormProps) {
  const [nota, setNota] = useState(0);
  const [hoverNota, setHoverNota] = useState(0);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');

  const handleSubmit = async () => {
    if (nota === 0) return;
    const comentarioTrim = comentario.trim();
    if (comentarioTrim && contemProfanity(comentarioTrim)) {
      setErro('O comentário contém linguagem inapropriada. Por favor, remova esses termos.');
      return;
    }
    setEnviando(true);
    setErro('');
    try {
      await onSubmit({
        autorUid,
        autorNome,
        autorFoto,
        vendedorUid,
        vendedorEmail,
        anuncioId,
        anuncioTipo,
        nota,
        comentario: comentarioTrim,
      });
      setEnviado(true);
      setNota(0);
      setComentario('');
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
      <Alert tipo="aviso" align="center" icone={<Clock />} titulo="Avaliação enviada!">
        A sua avaliação será visível após aprovação pela equipa RecarGarage.
      </Alert>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
      <h4 className="font-bold text-fg-heading text-sm mb-3">
        <StarHalf className="text-accent mr-1" />
        Avaliar Vendedor
      </h4>

      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            aria-label={`${star} de 5 estrelas`}
            onClick={() => setNota(star)}
            onMouseEnter={() => setHoverNota(star)}
            onMouseLeave={() => setHoverNota(0)}
            className="text-2xl transition-transform hover:scale-110"
          >
            <Star
              weight={star <= (hoverNota || nota) ? 'fill' : 'regular'}
              className={star <= (hoverNota || nota) ? 'text-yellow-500' : 'text-slate-300'}
            />
          </button>
        ))}
        {nota > 0 && (
          <span className="text-xs text-fg-subtle ml-2 font-semibold">
            {nota === 1 && 'Mau'}
            {nota === 2 && 'Razoável'}
            {nota === 3 && 'Bom'}
            {nota === 4 && 'Muito Bom'}
            {nota === 5 && 'Excelente'}
          </span>
        )}
      </div>

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
          disabled={nota === 0 || enviando}
          onClick={handleSubmit}
          icone={<PaperPlaneTilt />}
        >
          {enviando ? 'A enviar...' : 'Enviar Avaliação'}
        </Button>
      </div>
    </div>
  );
}
