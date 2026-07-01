import { Check, CircleNotch, Star, StarHalf, Trash, X } from '@phosphor-icons/react';
import { formatarDataHora } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import type { Review, StatusReview } from '@/types/review';

interface ReviewsQueueProps {
  reviews: Review[];
  loading: boolean;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function StarRating({ nota }: { nota: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={11}
          weight={star <= nota ? 'fill' : 'regular'}
          className={star <= nota ? 'text-yellow-700' : 'text-fg'}
        />
      ))}
    </span>
  );
}

const statusColors: Record<StatusReview, string> = {
  pendente: 'yellow',
  aprovado: 'green',
  rejeitado: 'red',
};

const statusLabels: Record<StatusReview, string> = {
  pendente: 'Pendente',
  aprovado: 'Aprovada',
  rejeitado: 'Rejeitada',
};

export default function ReviewsQueue({ reviews, loading, onApprove, onReject, onDelete }: ReviewsQueueProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <CircleNotch className="animate-spin text-2xl text-accent" />
      </div>
    );
  }

  const pendentes = reviews.filter((r) => r.status === 'pendente');
  const outras = reviews.filter((r) => r.status !== 'pendente');
  const sorted = [...pendentes, ...outras];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-extrabold text-fg-heading flex items-center gap-2">
          <StarHalf className="text-yellow-700" /> Avaliações
          {pendentes.length > 0 && <Badge cor="yellow" variante="solid">{pendentes.length}</Badge>}
        </h3>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-fg-subtle text-center py-6 bg-slate-50 rounded-xl">
          Nenhuma avaliação submetida.
        </p>
      ) : (
        <div className="space-y-3">
          {sorted.map((review) => (
            <div key={review.id} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge cor={statusColors[review.status] as any}>{statusLabels[review.status]}</Badge>
                    <StarRating nota={review.nota} />
                    <span className="text-[10px] text-fg-subtle">{formatarDataHora(review.dataCriacao)}</span>
                  </div>
                  <p className="text-xs text-fg-subtle">
                    <strong>De:</strong> {review.autorNome} ({review.autorUid.slice(0, 8)}...)
                  </p>
                  <p className="text-xs text-fg-subtle">
                    <strong>Para:</strong> {review.vendedorEmail}
                  </p>
                  {review.comentario && (
                    <p className="text-sm text-fg mt-2 bg-slate-50 rounded-lg p-2">{review.comentario}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                {review.status === 'pendente' && (
                  <>
                    <Button
                      tipo="verde"
                      tamanho="sm"
                      icone={<Check />}
                      onClick={() => onApprove(review.id)}
                    >
                      Aprovar
                    </Button>
                    <Button
                      tipo="perigo"
                      tamanho="sm"
                      icone={<X />}
                      onClick={() => onReject(review.id)}
                    >
                      Rejeitar
                    </Button>
                  </>
                )}
                <Button
                  tipo="secundario"
                  tamanho="sm"
                  icone={<Trash />}
                  onClick={() => onDelete(review.id)}
                  className="ml-auto"
                >
                  Eliminar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
