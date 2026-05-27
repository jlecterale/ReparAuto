import { useState } from 'react';
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
        comentario: comentario.trim(),
      });
      setEnviado(true);
      setNota(0);
      setComentario('');
    } catch {
      setErro('Erro ao enviar avaliação. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  if (enviado) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
        <i className="fa-solid fa-circle-check text-green-500 text-xl mb-2"></i>
        <p className="text-sm font-semibold text-green-800">Avaliação enviada com sucesso!</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
      <h4 className="font-bold text-brand-900 text-sm mb-3">
        <i className="fa-solid fa-star-half-stroke text-accent mr-1"></i>
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
            <i
              className={`fa-star ${
                star <= (hoverNota || nota) ? 'fa-solid text-yellow-400' : 'fa-regular text-slate-300'
              }`}
            ></i>
          </button>
        ))}
        {nota > 0 && (
          <span className="text-xs text-slate-500 ml-2 font-semibold">
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
          <i className="fa-solid fa-circle-exclamation"></i> {erro}
        </p>
      )}

      <div className="flex items-center justify-between mt-3">
        <span className="text-[10px] text-slate-400">{comentario.length}/500</span>
        <button
          onClick={handleSubmit}
          disabled={nota === 0 || enviando}
          className="bg-accent hover:bg-accent-hover text-white font-bold text-xs px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {enviando ? (
            <><i className="fa-solid fa-spinner fa-spin mr-1"></i> A enviar...</>
          ) : (
            <><i className="fa-solid fa-paper-plane mr-1"></i> Enviar Avaliação</>
          )}
        </button>
      </div>
    </div>
  );
}
