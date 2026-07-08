import { renderHook, act, waitFor } from '@testing-library/react';
import useFavoritos from '@/hooks/useFavoritos';
import type { Usuario } from '@/types/usuario';

// Firestore is mocked at the boundary. The behavior under test: toggling a
// favourite for a signed-in user must persist only the delta (arrayUnion /
// arrayRemove) instead of rewriting the whole favoritos array — a full-array
// write from a stale tab would silently drop favourites saved on another
// device.
const getDocMock = jest.fn();
const setDocMock = jest.fn();
const arrayUnionMock = jest.fn((...values: unknown[]) => ({ __op: 'arrayUnion', values }));
const arrayRemoveMock = jest.fn((...values: unknown[]) => ({ __op: 'arrayRemove', values }));

jest.mock('firebase/firestore', () => ({
  doc: (_db: unknown, ...segments: string[]) => ({ path: segments.join('/') }),
  getDoc: (...args: unknown[]) => getDocMock(...args),
  setDoc: (...args: unknown[]) => setDocMock(...args),
  arrayUnion: (...values: unknown[]) => arrayUnionMock(...values),
  arrayRemove: (...values: unknown[]) => arrayRemoveMock(...values),
}));
jest.mock('../lib/firebase', () => ({ db: {} }));
jest.mock('../lib/db', () => ({
  incrementCampo: jest.fn().mockResolvedValue(undefined),
  decrementCampo: jest.fn().mockResolvedValue(undefined),
  criarNotificacao: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../lib/offlineQueue', () => ({
  enqueue: jest.fn(),
  processQueue: jest.fn().mockResolvedValue({ succeeded: [], failed: [] }),
}));

const user = { uid: 'u1', email: 'u1@test.dev' } as Usuario;

function mockUserFavoritos(favoritos: string[]) {
  getDocMock.mockImplementation(async (ref: { path: string }) => {
    if (ref.path.startsWith('users/')) {
      return { exists: () => true, data: () => ({ favoritos }) };
    }
    return { exists: () => false, data: () => ({}) };
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useFavoritos (utilizador autenticado)', () => {
  it('adiciona um favorito persistindo apenas o delta (arrayUnion), não a lista inteira', async () => {
    mockUserFavoritos(['car_outro']);
    const { result } = renderHook(() => useFavoritos(user));
    await waitFor(() => expect(result.current.favoritos).toEqual(['car_outro']));

    act(() => result.current.toggleFavorito('abc', 'cars'));

    await waitFor(() => expect(setDocMock).toHaveBeenCalled());
    expect(arrayUnionMock).toHaveBeenCalledWith('car_abc');
    const [, payload, options] = setDocMock.mock.calls[0];
    expect(payload).toEqual({ favoritos: { __op: 'arrayUnion', values: ['car_abc'] } });
    expect(options).toEqual({ merge: true });
    // Optimistic local state still reflects the full list.
    expect(result.current.favoritos).toEqual(['car_outro', 'car_abc']);
  });

  it('remove um favorito com arrayRemove cobrindo o id prefixado e o legado sem prefixo', async () => {
    mockUserFavoritos(['car_abc']);
    const { result } = renderHook(() => useFavoritos(user));
    await waitFor(() => expect(result.current.favoritos).toEqual(['car_abc']));

    act(() => result.current.toggleFavorito('abc', 'cars'));

    await waitFor(() => expect(setDocMock).toHaveBeenCalled());
    expect(arrayRemoveMock).toHaveBeenCalledWith('car_abc', 'abc');
    const [, payload] = setDocMock.mock.calls[0];
    expect(payload).toEqual({ favoritos: { __op: 'arrayRemove', values: ['car_abc', 'abc'] } });
    expect(result.current.favoritos).toEqual([]);
  });
});
