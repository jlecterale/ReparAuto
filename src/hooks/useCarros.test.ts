import { renderHook, act, waitFor } from '@testing-library/react';
import useCarros from './useCarros';
import { clearSellerVerificationCache } from './useVerifiedSellers';
import { subscribeCarros, getVerifiedUids } from '@/lib/db';
import type { Carro } from '@/types/carro';

jest.mock('@/lib/db', () => ({
  subscribeCarros: jest.fn(),
  addCarro: jest.fn(),
  deleteCarro: jest.fn(),
  getVerifiedUids: jest.fn(),
}));

const mockSubscribe = subscribeCarros as jest.Mock;
const mockGetVerifiedUids = getVerifiedUids as jest.Mock;

const carro = (id: string, criadorUid: string, preco: number) =>
  ({ id, criadorUid, preco, status: 'aprovado' }) as unknown as Carro;

let emit: (carros: Carro[]) => void;

beforeEach(() => {
  jest.clearAllMocks();
  clearSellerVerificationCache();
  mockSubscribe.mockImplementation((onData: (carros: Carro[]) => void) => {
    emit = onData;
    return jest.fn();
  });
  mockGetVerifiedUids.mockResolvedValue([]);
});

describe('useCarros — prioritization of verified sellers', () => {
  it('lists cars from verified sellers first in the default order', async () => {
    mockGetVerifiedUids.mockResolvedValue(['u2']);
    const { result } = renderHook(() => useCarros());

    act(() => emit([carro('c1', 'u1', 1000), carro('c2', 'u2', 3000), carro('c3', 'u1', 2000)]));

    await waitFor(() =>
      expect(result.current.carrosFiltrados.map((c) => c.id)).toEqual(['c2', 'c1', 'c3']),
    );
    expect(result.current.verifiedUids.has('u2')).toBe(true);
  });

  it('keeps the subscription (recency) order while no seller is verified', async () => {
    const { result } = renderHook(() => useCarros());

    act(() => emit([carro('c1', 'u1', 1000), carro('c2', 'u2', 3000)]));

    await waitFor(() => expect(mockGetVerifiedUids).toHaveBeenCalled());
    expect(result.current.carrosFiltrados.map((c) => c.id)).toEqual(['c1', 'c2']);
  });

  it('respects an explicit price sort over the verified boost', async () => {
    mockGetVerifiedUids.mockResolvedValue(['u2']);
    const { result } = renderHook(() => useCarros());

    act(() => emit([carro('c1', 'u1', 1000), carro('c2', 'u2', 3000), carro('c3', 'u1', 2000)]));
    await waitFor(() => expect(result.current.verifiedUids.has('u2')).toBe(true));

    act(() => result.current.setSortOrdem('crescente'));

    expect(result.current.carrosFiltrados.map((c) => c.id)).toEqual(['c1', 'c3', 'c2']);
  });
});
