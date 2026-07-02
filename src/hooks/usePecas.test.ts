import { renderHook, act, waitFor } from '@testing-library/react';
import usePecas from './usePecas';
import { clearSellerVerificationCache } from './useVerifiedSellers';
import { subscribePecas, getVerifiedUids } from '@/lib/db';
import type { Peca } from '@/types/peca';

jest.mock('@/lib/db', () => ({
  subscribePecas: jest.fn(),
  addPeca: jest.fn(),
  deletePeca: jest.fn(),
  getVerifiedUids: jest.fn(),
}));

const mockSubscribe = subscribePecas as jest.Mock;
const mockGetVerifiedUids = getVerifiedUids as jest.Mock;

const peca = (id: string, criadorUid: string) =>
  ({
    id,
    criadorUid,
    tipo: 'venda',
    titulo: `Peca ${id}`,
    descricao: '',
    marcaCarro: 'VW',
    categoria: 'Motor',
    estado: 'usado',
  }) as unknown as Peca;

let emit: (pecas: Peca[]) => void;

beforeEach(() => {
  jest.clearAllMocks();
  clearSellerVerificationCache();
  mockSubscribe.mockImplementation((onData: (pecas: Peca[]) => void) => {
    emit = onData;
    return jest.fn();
  });
  mockGetVerifiedUids.mockResolvedValue([]);
});

describe('usePecas — prioritization of verified sellers', () => {
  it('lists parts from verified sellers first', async () => {
    mockGetVerifiedUids.mockResolvedValue(['u2']);
    const { result } = renderHook(() => usePecas());

    act(() => emit([peca('p1', 'u1'), peca('p2', 'u2'), peca('p3', 'u1')]));

    await waitFor(() =>
      expect(result.current.pecasFiltradas.map((p) => p.id)).toEqual(['p2', 'p1', 'p3']),
    );
    expect(result.current.verifiedUids.has('u2')).toBe(true);
  });

  it('keeps the subscription order while no seller is verified', async () => {
    const { result } = renderHook(() => usePecas());

    act(() => emit([peca('p1', 'u1'), peca('p2', 'u2')]));

    await waitFor(() => expect(mockGetVerifiedUids).toHaveBeenCalled());
    expect(result.current.pecasFiltradas.map((p) => p.id)).toEqual(['p1', 'p2']);
  });
});
