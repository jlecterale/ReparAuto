import { useState, useEffect, useCallback } from 'react';
import { subscribeReviews, addReview, deleteReview, updateSellerRating } from '@/lib/db';
import type { Review, ReviewInput } from '@/types/review';

export default function useReviews(vendedorEmail: string | undefined) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!vendedorEmail) {
      setReviews([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeReviews(
      vendedorEmail,
      (data) => {
        setReviews(data);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [vendedorEmail]);

  const media = reviews.length > 0
    ? Math.round((reviews.reduce((sum, r) => sum + r.nota, 0) / reviews.length) * 10) / 10
    : 0;

  const criar = useCallback(async (data: ReviewInput) => {
    const review = await addReview(data);
    await updateSellerRating(data.vendedorUid, data.vendedorEmail);
    return review;
  }, []);

  const remover = useCallback(async (id: string, vendedorUid: string, vendedorEmailParam: string) => {
    await deleteReview(id);
    await updateSellerRating(vendedorUid, vendedorEmailParam);
  }, []);

  return {
    reviews,
    loading,
    media,
    total: reviews.length,
    criar,
    remover,
  };
}
