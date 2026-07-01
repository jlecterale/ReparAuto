import { renderHook, act, waitFor } from '@testing-library/react';
import useSavedSearches from '@/hooks/useSavedSearches';
import type { SavedSearch } from '@/types/preco';

// Mock the Firestore-touching db layer at the boundary. Tests exercise the
// hook's reload/reactivity semantics — not the DB itself.
jest.mock('../lib/db', () => ({
  addSavedSearch: jest.fn(async () => 'new-id'),
  deleteSavedSearch: jest.fn(async () => undefined),
  updateSavedSearch: jest.fn(async () => undefined),
  getSavedSearches: jest.fn(async () => [] as SavedSearch[]),
}));

import {
  addSavedSearch,
  deleteSavedSearch,
  getSavedSearches,
  updateSavedSearch,
} from '@/lib/db';

const mockGet = getSavedSearches as jest.MockedFunction<typeof getSavedSearches>;
const mockAdd = addSavedSearch as jest.MockedFunction<typeof addSavedSearch>;
const mockDelete = deleteSavedSearch as jest.MockedFunction<typeof deleteSavedSearch>;
const mockUpdate = updateSavedSearch as jest.MockedFunction<typeof updateSavedSearch>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useSavedSearches', () => {
  it('starts empty and does not call the DB when uid is null', async () => {
    const { result } = renderHook(() => useSavedSearches(null));
    expect(result.current.searches).toEqual([]);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('loads searches once for a given uid', async () => {
    const fixture = [{ id: '1', uid: 'user-1', nome: 'A' } as unknown as SavedSearch];
    mockGet.mockResolvedValueOnce(fixture);

    const { result } = renderHook(() => useSavedSearches('user-1'));

    await waitFor(() => expect(result.current.searches).toEqual(fixture));
    expect(mockGet).toHaveBeenCalledWith('user-1');
  });

  it('refuses to add a search when there is no uid', async () => {
    const { result } = renderHook(() => useSavedSearches(null));

    await expect(
      act(async () => {
        await result.current.adicionar('X', { marca: 'VW' });
      }),
    ).rejects.toThrow(/Utilizador não autenticado/);
    expect(mockAdd).not.toHaveBeenCalled();
  });

  it('adds a search and reloads', async () => {
    // Initial reload returns [], the follow-up reload after adicionar returns [one].
    const one = { id: '1', uid: 'user-1', nome: 'A' } as unknown as SavedSearch;
    mockGet.mockResolvedValueOnce([]).mockResolvedValueOnce([one]);

    const { result } = renderHook(() => useSavedSearches('user-1'));
    await waitFor(() => expect(result.current.searches).toEqual([]));

    await act(async () => {
      await result.current.adicionar('Nova', { marca: 'VW' });
    });

    expect(mockAdd).toHaveBeenCalledWith({
      uid: 'user-1',
      nome: 'Nova',
      criterios: { marca: 'VW' },
      alertasAtivos: true,
    });
    await waitFor(() => expect(result.current.searches).toEqual([one]));
  });

  it('deletes a search and reloads', async () => {
    mockGet.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    const { result } = renderHook(() => useSavedSearches('user-1'));
    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));

    await act(async () => {
      await result.current.eliminar('to-delete');
    });

    expect(mockDelete).toHaveBeenCalledWith('to-delete');
    expect(mockGet).toHaveBeenCalledTimes(2);
  });

  it('toggles alerts flag and reloads', async () => {
    mockGet.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    const { result } = renderHook(() => useSavedSearches('user-1'));
    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));

    await act(async () => {
      await result.current.alternarAlertas('s-42', false);
    });

    expect(mockUpdate).toHaveBeenCalledWith('s-42', { alertasAtivos: false });
    expect(mockGet).toHaveBeenCalledTimes(2);
  });
});
