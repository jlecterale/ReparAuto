import { renderHook, act } from '@testing-library/react';
import { useCepBr } from '@/hooks/useCepBr';

// BrasilAPI is mocked at the boundary — the fetch response is what varies
// across scenarios. The hook must surface the neighbourhood ("bairro") as its
// own field instead of folding it into the street suggestion, so the profile
// forms can auto-fill a dedicated Bairro input (standard BR address UX).
const fetchMock = jest.fn();
global.fetch = fetchMock as unknown as typeof fetch;

function cepResponse(body: Record<string, unknown>, ok = true) {
  return { ok, status: ok ? 200 : 404, json: async () => body };
}

beforeEach(() => {
  fetchMock.mockReset();
});

describe('useCepBr', () => {
  it('expõe o bairro como campo próprio e mantém só a rua na sugestão de morada', async () => {
    fetchMock.mockResolvedValue(
      cepResponse({
        state: 'SP',
        city: 'São Paulo',
        neighborhood: 'Bela Vista',
        street: 'Avenida Paulista',
      })
    );

    const { result } = renderHook(() => useCepBr());
    await act(() => result.current.buscar('01310-100'));

    expect(result.current.bairro).toBe('Bela Vista');
    expect(result.current.ruas).toEqual(['Avenida Paulista']);
    expect(result.current.localidade).toBe('São Paulo');
    expect(result.current.distrito).toBe('São Paulo');
  });

  it('deixa o bairro vazio quando o CEP geral não devolve neighborhood', async () => {
    // Small-town "CEP geral" responses come back without street/neighbourhood —
    // the form must tolerate it and leave the field for manual entry.
    fetchMock.mockResolvedValue(cepResponse({ state: 'MG', city: 'Monte Verde' }));

    const { result } = renderHook(() => useCepBr());
    await act(() => result.current.buscar('37653-000'));

    expect(result.current.bairro).toBe('');
    expect(result.current.ruas).toEqual([]);
    expect(result.current.localidade).toBe('Monte Verde');
  });

  it('sinaliza erro e não preenche nada quando o CEP não existe', async () => {
    fetchMock.mockResolvedValue(cepResponse({}, false));

    const { result } = renderHook(() => useCepBr());
    await act(() => result.current.buscar('99999-999'));

    expect(result.current.erro).toBe('CEP não encontrado. Preencha manualmente.');
    expect(result.current.bairro).toBe('');
    expect(result.current.ruas).toEqual([]);
  });
});
