import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useMarcasModelos } from '@/hooks/useMarcasModelos';
import CountryProvider from '@/providers/CountryProvider';
import { COUNTRY_STORAGE_KEY } from '@/lib/country';

// The hook reads the active market (PT here) to pick between the Firestore
// catalog and the FIPE one, so every render needs a CountryProvider ancestor.
// Pre-seeding the stored preference keeps the provider on its synchronous
// "stored" branch — otherwise its first-launch GeoIP lookup would fire a real
// network request from the test.
const wrapper = ({ children }: { children: ReactNode }) => <CountryProvider>{children}</CountryProvider>;

// Firestore is mocked at the boundary: getDocs is what the hook awaits, and
// its resolution/rejection is what we vary across the scenarios below.
const getDocsMock = jest.fn();
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  getDocs: (...args: unknown[]) => getDocsMock(...args),
}));
jest.mock('../lib/firebase', () => ({ db: {} }));

// Bundled static list — the fallback the hook must fall back to.
import fallbackJson from '@/data/marcas-modelos.json';
const fallbackMarcas = (fallbackJson as { marca: string }[]).map((d) => d.marca);

/** Build a fake Firestore snapshot whose forEach yields the given docs. */
function snapshotOf(docs: Array<{ id: string; data: Record<string, unknown> }>) {
  return {
    forEach: (cb: (doc: { id: string; data: () => Record<string, unknown> }) => void) =>
      docs.forEach((d) => cb({ id: d.id, data: () => d.data })),
  };
}

beforeEach(() => {
  localStorage.setItem(COUNTRY_STORAGE_KEY, 'PT');
  getDocsMock.mockReset();
});

const sortedFallback = [...fallbackMarcas].sort((a, b) => a.localeCompare(b));

describe('useMarcasModelos', () => {
  it('mostra o JSON empacotado imediatamente, sem esperar o Firestore', () => {
    // getDocs never resolves — the list must already be populated on first render.
    getDocsMock.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useMarcasModelos(), { wrapper });

    expect(result.current.loading).toBe(false);
    expect(result.current.marcas).toEqual(sortedFallback);
  });

  it('substitui pelo resultado do Firestore quando a query retorna documentos', async () => {
    getDocsMock.mockResolvedValue(
      snapshotOf([{ id: 'Tesla', data: { tipos: ['carro'], modelos: ['Model 3'], ativo: true } }])
    );

    const { result } = renderHook(() => useMarcasModelos(), { wrapper });

    await waitFor(() => expect(result.current.marcas).toEqual(['Tesla']));
    expect(result.current.getModelos('Tesla')).toEqual(['Model 3']);
  });

  it('mantém o JSON empacotado quando o Firestore retorna vazio (sem lançar erro)', async () => {
    // persistentLocalCache resolves an offline/unreachable read to an empty
    // snapshot instead of throwing — the seeded fallback must stay in place.
    getDocsMock.mockResolvedValue(snapshotOf([]));

    const { result } = renderHook(() => useMarcasModelos(), { wrapper });

    await waitFor(() => expect(getDocsMock).toHaveBeenCalled());
    expect(result.current.marcas).toEqual(sortedFallback);
  });

  it('ignora um cache vazio no localStorage (poisoned cache) e mostra o fallback', () => {
    // A previous version could persist `[]`; a still-in-TTL empty cache must
    // not pin an empty brand list — it should be treated as absent.
    localStorage.setItem(
      'marcas_modelos_cache',
      JSON.stringify({ timestamp: 8640000000000, dados: [] })
    );
    getDocsMock.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useMarcasModelos(), { wrapper });

    expect(result.current.marcas).toEqual(sortedFallback);
  });

  it('mantém o JSON empacotado quando a query lança erro', async () => {
    getDocsMock.mockRejectedValue(new Error('permission-denied'));

    const { result } = renderHook(() => useMarcasModelos(), { wrapper });

    await waitFor(() => expect(getDocsMock).toHaveBeenCalled());
    expect(result.current.marcas).toEqual(sortedFallback);
    expect(result.current.error).toBeNull();
  });
});
