'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { subscribeReviews, addReview, updateReview, deleteReview, updateSellerRating, getAllReviewsAdmin, updateReviewStatus } from '@/lib/db';
import type { Review, ReviewInput, StatusReview } from '@/types/review';

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
    return await addReview(data);
  }, []);

  const atualizar = useCallback(async (
    autorUid: string,
    anuncioId: string,
    data: Partial<ReviewInput>,
  ) => {
    await updateReview(autorUid, anuncioId, data);
  }, []);

  const remover = useCallback(async (id: string, vendedorUid: string, vendedorEmailParam: string) => {
    await deleteReview(id);
    await updateSellerRating(vendedorUid, vendedorEmailParam);
  }, []);

  /** Returns the current user's review for a specific listing, if it exists. */
  const jaAvaliou = useCallback(
    (autorUid: string, anuncioId: string): Review | undefined => {
      return reviews.find((r) => r.autorUid === autorUid && r.anuncioId === anuncioId);
    },
    [reviews],
  );

  return {
    reviews,
    loading,
    media,
    total: reviews.length,
    criar,
    atualizar,
    remover,
    jaAvaliou,
  };
}

export function useReviewsAdmin() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    const data = await getAllReviewsAdmin();
    setReviews(data);
    setLoading(false);
  }, []);

  const atualizarStatus = useCallback(async (
    id: string,
    status: StatusReview,
    vendedorUid: string,
    vendedorEmail: string,
  ) => {
    await updateReviewStatus(id, status);
    if (status === 'aprovado') {
      await updateSellerRating(vendedorUid, vendedorEmail);
    }
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r)),
    );
  }, []);

  const remover = useCallback(async (
    id: string,
    vendedorUid: string,
    vendedorEmail: string,
  ) => {
    await deleteReview(id);
    await updateSellerRating(vendedorUid, vendedorEmail);
    setReviews((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return {
    reviews,
    loading,
    carregar,
    atualizarStatus,
    remover,
  };
}
