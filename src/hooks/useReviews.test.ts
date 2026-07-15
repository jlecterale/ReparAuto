import { renderHook, act } from '@testing-library/react';
import useReviews from '@/hooks/useReviews';
import { deleteReview, subscribeReviews, updateSellerRating } from '@/lib/db';

// The public remover is only reachable by a review's author (ReviewsList
// gates the delete button on autorUid), and firestore.rules deny an author
// writing the seller's profile — recomputing the seller rating from this
// path always failed after burning a full reviews + profile read. Deleting
// must therefore be a single operation; the admin queue (useReviewsAdmin)
// keeps its recompute, where the write is actually allowed.
jest.mock('../lib/db', () => ({
  subscribeReviews: jest.fn(() => jest.fn()),
  addReview: jest.fn(),
  deleteReview: jest.fn().mockResolvedValue(undefined),
  updateSellerRating: jest.fn(),
  getAllReviewsAdmin: jest.fn(),
  updateReviewStatus: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useReviews.remover (autor apaga a própria review)', () => {
  it('apaga a review sem tentar recalcular o rating do vendedor', async () => {
    const { result } = renderHook(() => useReviews('vendedor@test.dev'));
    expect(subscribeReviews).toHaveBeenCalled();

    await act(async () => {
      await result.current.remover('r1');
    });

    expect(deleteReview).toHaveBeenCalledWith('r1');
    expect(updateSellerRating).not.toHaveBeenCalled();
  });
});
