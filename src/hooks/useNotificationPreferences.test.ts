import { renderHook, act, waitFor } from '@testing-library/react';
import useNotificationPreferences from './useNotificationPreferences';
import { getNotificationPreferences, updateNotificationPreferences } from '@/lib/db';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '@/lib/alerts';

jest.mock('@/lib/db', () => ({
  getNotificationPreferences: jest.fn(),
  updateNotificationPreferences: jest.fn(),
}));

const mockGet = getNotificationPreferences as jest.Mock;
const mockUpdate = updateNotificationPreferences as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockGet.mockResolvedValue(DEFAULT_NOTIFICATION_PREFERENCES);
  mockUpdate.mockResolvedValue(undefined);
});

describe('useNotificationPreferences', () => {
  it('loads the stored preferences for the uid', async () => {
    mockGet.mockResolvedValue({
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      alerta: { inApp: true, push: false },
    });
    const { result } = renderHook(() => useNotificationPreferences('u1'));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.prefs.alerta).toEqual({ inApp: true, push: false });
  });

  it('toggle flips a channel optimistically and persists the full object', async () => {
    const { result } = renderHook(() => useNotificationPreferences('u1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.toggle('preco', 'push');
    });

    expect(result.current.prefs.preco.push).toBe(false);
    expect(mockUpdate).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({ preco: { inApp: true, push: false } }),
    );
  });

  it('reverts the optimistic change when persisting fails', async () => {
    mockUpdate.mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useNotificationPreferences('u1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.toggle('mensagem', 'inApp');
    });

    expect(result.current.prefs.mensagem.inApp).toBe(true);
  });

  it('stays on defaults without a uid', () => {
    const { result } = renderHook(() => useNotificationPreferences(undefined));
    expect(mockGet).not.toHaveBeenCalled();
    expect(result.current.prefs).toEqual(DEFAULT_NOTIFICATION_PREFERENCES);
    expect(result.current.loading).toBe(false);
  });
});
