import { renderHook, waitFor } from '@testing-library/react';
import useVerifiedSellers, { clearSellerVerificationCache } from './useVerifiedSellers';
import { getVerifiedUids } from '@/lib/db';

jest.mock('@/lib/db', () => ({
  getVerifiedUids: jest.fn(),
}));

const mockGetVerifiedUids = getVerifiedUids as jest.Mock;

const listing = (id: string, criadorUid?: string) => ({ id, criadorUid });

beforeEach(() => {
  jest.clearAllMocks();
  clearSellerVerificationCache();
});

describe('useVerifiedSellers', () => {
  it('fetches the unique seller uids and exposes the verified ones as a set', async () => {
    mockGetVerifiedUids.mockResolvedValue(['u2']);
    const items = [listing('a', 'u1'), listing('b', 'u2'), listing('c', 'u2')];

    const { result } = renderHook(() => useVerifiedSellers(items));

    await waitFor(() => expect(result.current.has('u2')).toBe(true));
    expect(mockGetVerifiedUids).toHaveBeenCalledTimes(1);
    expect(mockGetVerifiedUids).toHaveBeenCalledWith(['u1', 'u2']);
    expect(result.current.has('u1')).toBe(false);
  });

  it('does not refetch uids already resolved', async () => {
    mockGetVerifiedUids.mockResolvedValue(['u1']);
    const items = [listing('a', 'u1')];

    const { result, rerender } = renderHook(({ list }) => useVerifiedSellers(list), {
      initialProps: { list: items },
    });
    await waitFor(() => expect(result.current.has('u1')).toBe(true));

    rerender({ list: [listing('a', 'u1'), listing('b', 'u1')] });
    await waitFor(() => expect(result.current.has('u1')).toBe(true));

    expect(mockGetVerifiedUids).toHaveBeenCalledTimes(1);
  });

  it('fetches only the uids not seen before when new listings arrive', async () => {
    mockGetVerifiedUids.mockResolvedValueOnce(['u1']).mockResolvedValueOnce([]);

    const { result, rerender } = renderHook(({ list }) => useVerifiedSellers(list), {
      initialProps: { list: [listing('a', 'u1')] },
    });
    await waitFor(() => expect(result.current.has('u1')).toBe(true));

    rerender({ list: [listing('a', 'u1'), listing('b', 'u2')] });
    await waitFor(() => expect(mockGetVerifiedUids).toHaveBeenCalledTimes(2));

    expect(mockGetVerifiedUids).toHaveBeenLastCalledWith(['u2']);
    await waitFor(() => expect(result.current.has('u1')).toBe(true));
    expect(result.current.has('u2')).toBe(false);
  });

  it('does not fetch when there are no seller uids', () => {
    const { result } = renderHook(() => useVerifiedSellers([listing('a')]));
    expect(mockGetVerifiedUids).not.toHaveBeenCalled();
    expect(result.current.size).toBe(0);
  });
});
