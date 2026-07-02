import { render, screen } from '@testing-library/react';
import DetalhesCarro from './DetalhesCarro';
import { buildCarro } from '@/test/factories';
import { serializeCarro } from '@/lib/serializeCarro';
import { getCarroPorId, incrementCampo } from '@/lib/db';

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'abc123' }),
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

jest.mock('../providers/AppProvider', () => ({
  useApp: () => ({
    auth: { user: null, isAdmin: false },
    favoritos: { toggleFavorito: jest.fn(), isFavorito: () => false },
  }),
}));

jest.mock('../lib/db', () => ({
  getCarroPorId: jest.fn().mockResolvedValue(null),
  incrementCampo: jest.fn(),
  updateCarro: jest.fn(),
  deleteCarro: jest.fn(),
}));

// Children with their own Firebase-backed data flows — out of scope here.
jest.mock('../components/detalhes/ContactSection', () => () => null);
jest.mock('../components/detalhes/GalleryModal', () => () => null);
jest.mock('../components/detalhes/FinanciamentoSeguroWidget', () => () => null);
jest.mock('../components/pecas/CompatibleParts', () => () => null);
jest.mock('../components/trust/VinCheckPanel', () => () => null);
jest.mock('../components/admin/EditarCarroModal', () => () => null);

beforeAll(() => {
  class IntersectionObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.defineProperty(globalThis, 'IntersectionObserver', {
    writable: true,
    value: IntersectionObserverStub,
  });
});

afterEach(() => {
  sessionStorage.clear();
  jest.clearAllMocks();
});

describe('DetalhesCarro', () => {
  it('renders the server-provided listing immediately without re-fetching it on the client', () => {
    const initialCarro = serializeCarro(buildCarro({ id: 'abc123', marca: 'Renault', modelo: 'Clio' }));

    render(<DetalhesCarro initialCarro={initialCarro} />);

    expect(screen.getByRole('heading', { name: /Renault Clio/ })).toBeInTheDocument();
    expect(getCarroPorId).not.toHaveBeenCalled();
  });

  it('counts the view once per session even when the listing comes from the server', () => {
    const initialCarro = serializeCarro(buildCarro({ id: 'abc123' }));

    const { unmount } = render(<DetalhesCarro initialCarro={initialCarro} />);
    unmount();
    render(<DetalhesCarro initialCarro={initialCarro} />);

    expect(incrementCampo).toHaveBeenCalledTimes(1);
    expect(incrementCampo).toHaveBeenCalledWith('cars', 'abc123', 'visualizacoes');
  });

  it('still fetches the listing client-side when the server provides none', async () => {
    (getCarroPorId as jest.Mock).mockResolvedValue(buildCarro({ id: 'abc123', marca: 'Fiat', modelo: 'Punto' }));

    render(<DetalhesCarro />);

    expect(await screen.findByRole('heading', { name: /Fiat Punto/ })).toBeInTheDocument();
    expect(getCarroPorId).toHaveBeenCalledWith('abc123');
  });
});
