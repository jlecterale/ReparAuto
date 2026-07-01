import { renderHook, act, waitFor } from '@testing-library/react';
import useAlertSubscriptions from './useAlertSubscriptions';
import {
  addAlertSubscription,
  deleteAlertSubscription,
  subscribeAlertSubscriptions,
  updateAlertSubscription,
} from '@/lib/db';
import type { AlertSubscription } from '@/types/alertas';

jest.mock('@/lib/db', () => ({
  addAlertSubscription: jest.fn(),
  deleteAlertSubscription: jest.fn(),
  subscribeAlertSubscriptions: jest.fn(),
  updateAlertSubscription: jest.fn(),
}));

const mockSubscribe = subscribeAlertSubscriptions as jest.Mock;
const mockAdd = addAlertSubscription as jest.Mock;
const mockDelete = deleteAlertSubscription as jest.Mock;
const mockUpdate = updateAlertSubscription as jest.Mock;

const alerta = {
  id: 'a1',
  uid: 'u1',
  tipo: 'palavra_chave',
  nome: 'Golf',
  keyword: 'golf',
  ativo: true,
  novosResultados: 0,
} as unknown as AlertSubscription;

beforeEach(() => {
  jest.clearAllMocks();
  mockSubscribe.mockReturnValue(jest.fn());
});

describe('useAlertSubscriptions', () => {
  it('subscribes for the uid and exposes the live list', async () => {
    let emit: (subs: AlertSubscription[]) => void = () => {};
    mockSubscribe.mockImplementation((_uid, onData) => {
      emit = onData;
      return jest.fn();
    });

    const { result } = renderHook(() => useAlertSubscriptions('u1'));
    expect(result.current.loading).toBe(true);

    act(() => emit([alerta]));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.alertas).toEqual([alerta]);
    expect(mockSubscribe).toHaveBeenCalledWith('u1', expect.any(Function), expect.any(Function));
  });

  it('does nothing without a uid', () => {
    const { result } = renderHook(() => useAlertSubscriptions(undefined));
    expect(mockSubscribe).not.toHaveBeenCalled();
    expect(result.current.alertas).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('unsubscribes on unmount', () => {
    const unsubscribe = jest.fn();
    mockSubscribe.mockReturnValue(unsubscribe);
    const { unmount } = renderHook(() => useAlertSubscriptions('u1'));
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });

  it('criar delegates to the db layer with the uid', async () => {
    mockAdd.mockResolvedValue(alerta);
    const { result } = renderHook(() => useAlertSubscriptions('u1'));
    await act(async () => {
      await result.current.criar({ tipo: 'palavra_chave', nome: '', ativo: true, keyword: 'golf' });
    });
    expect(mockAdd).toHaveBeenCalledWith('u1', expect.objectContaining({ keyword: 'golf' }));
  });

  it('exposes atLimit when the cap is reached', async () => {
    let emit: (subs: AlertSubscription[]) => void = () => {};
    mockSubscribe.mockImplementation((_uid, onData) => {
      emit = onData;
      return jest.fn();
    });
    const { result } = renderHook(() => useAlertSubscriptions('u1'));
    const many = Array.from({ length: 20 }, (_, i) => ({ ...alerta, id: `a${i}` }));
    act(() => emit(many as AlertSubscription[]));
    await waitFor(() => expect(result.current.atLimit).toBe(true));
  });

  it('atualizar and remover delegate to the db layer', async () => {
    const { result } = renderHook(() => useAlertSubscriptions('u1'));
    await act(async () => {
      await result.current.atualizar('a1', { ativo: false });
      await result.current.remover('a1');
    });
    expect(mockUpdate).toHaveBeenCalledWith('a1', { ativo: false });
    expect(mockDelete).toHaveBeenCalledWith('a1');
  });
});
