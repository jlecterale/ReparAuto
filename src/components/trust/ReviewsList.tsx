import { formatarData } from '@/lib/utils';
import type { Review } from '@/types/review';
import UserAvatar from '@/components/ui/UserAvatar';

interface ReviewsListProps {
  reviews: Review[];
  loading: boolean;
  media: number;
  total: number;
  currentUserUid?: string;
  onDelete?: (id: string) => void;
}

function StarRating({ nota }: { nota: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <i
          key={star}
          className={`fa-star text-xs ${star <= nota ? 'fa-solid text-yellow-400' : 'fa-regular text-slate-300'}`}
        ></i>
      ))}
    </div>
  );
}

export default function ReviewsList({ reviews, loading, media, total, currentUserUid, onDelete }: ReviewsListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <i className="fa-solid fa-spinner fa-spin text-xl text-accent"></i>
      </div>
    );
  }

  return (
    <div>
      {total > 0 && (
        <div className="flex items-center gap-3 mb-4 bg-slate-50 rounded-xl p-3">
          <div className="text-center">
            <p className="text-2xl font-extrabold text-brand-900">{media}</p>
            <StarRating nota={Math.round(media)} />
          </div>
          <div className="text-xs text-slate-500">
            <p className="font-semibold">{total} {total === 1 ? 'avaliação' : 'avaliações'}</p>
          </div>
        </div>
      )}

      {total === 0 && (
        <p className="text-sm text-slate-400 text-center py-4">
          Ainda não existem avaliações para este vendedor.
        </p>
      )}

      <div className="space-y-3">
        {reviews.map((review) => (
          <div key={review.id} className="bg-white border border-slate-200 rounded-xl p-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 flex-shrink-0">
                  <UserAvatar user={{ nome: review.autorNome, foto: review.autorFoto } as any} size="sm" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-brand-900">{review.autorNome}</p>
                  <div className="flex items-center gap-2">
                    <StarRating nota={review.nota} />
                    <span className="text-[10px] text-slate-400">{formatarData(review.dataCriacao)}</span>
                  </div>
                </div>
              </div>
              {currentUserUid === review.autorUid && onDelete && (
                <button
                  onClick={() => onDelete(review.id)}
                  className="text-xs text-red-400 hover:text-red-600 transition"
                  title="Eliminar avaliação"
                >
                  <i className="fa-solid fa-trash-can"></i>
                </button>
              )}
            </div>
            {review.comentario && (
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">{review.comentario}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
