import { renderHook, act } from '@testing-library/react';
import useCompare, { resetCompareStoreForTests } from './useCompare';

beforeEach(() => {
  sessionStorage.clear();
  resetCompareStoreForTests();
});

describe('useCompare', () => {
  it('toggles ids in and out of the selection', () => {
    const { result } = renderHook(() => useCompare());

    act(() => {
      result.current.toggle('a');
    });
    expect(result.current.ids).toEqual(['a']);

    act(() => {
      result.current.toggle('a');
    });
    expect(result.current.ids).toEqual([]);
  });

  it('rejects a fourth selection and reports it', () => {
    const { result } = renderHook(() => useCompare());

    let accepted = true;
    act(() => {
      result.current.toggle('a');
      result.current.toggle('b');
      result.current.toggle('c');
    });
    act(() => {
      accepted = result.current.toggle('d');
    });

    expect(accepted).toBe(false);
    expect(result.current.ids).toEqual(['a', 'b', 'c']);
  });

  it('shares the selection between hook instances', () => {
    const first = renderHook(() => useCompare());
    const second = renderHook(() => useCompare());

    act(() => {
      first.result.current.toggle('a');
    });

    expect(second.result.current.ids).toEqual(['a']);
  });

  it('persists the selection in sessionStorage and restores it', () => {
    const { result } = renderHook(() => useCompare());
    act(() => {
      result.current.toggle('a');
      result.current.toggle('b');
    });

    resetCompareStoreForTests({ keepStorage: true });
    const restored = renderHook(() => useCompare());
    expect(restored.result.current.ids).toEqual(['a', 'b']);
  });

  it('clears the whole selection', () => {
    const { result } = renderHook(() => useCompare());
    act(() => {
      result.current.toggle('a');
      result.current.toggle('b');
      result.current.clear();
    });
    expect(result.current.ids).toEqual([]);
  });
});
