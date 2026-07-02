import { render, screen } from '@testing-library/react';
import Home from './Home';
import { buildCarro } from '@/test/factories';
import { serializeCarro } from '@/lib/serializeCarro';
import type { Carro } from '@/types/carro';

// Mutable per-test state consumed by the useApp mock below.
const appState: { loading: boolean; carrosFiltrados: Carro[] } = {
  loading: true,
  carrosFiltrados: [],
};

jest.mock('../components/home/MonetizationCarousel', () => () => null);

jest.mock('../hooks/useDistritosConcelhos', () => ({
  useDistritosConcelhos: () => ({ distritos: [], getConcelhos: () => [] }),
}));

jest.mock('../lib/db', () => ({
  buscarIntencoesMatch: jest.fn().mockResolvedValue([]),
  getIntencoesAtivas: jest.fn().mockResolvedValue([]),
  subscribeOficinas: jest.fn(() => () => {}),
}));

jest.mock('../providers/AppProvider', () => ({
  useApp: () => ({
    auth: { user: null },
    chat: null,
    loginModal: { openLoginModal: jest.fn() },
    favoritos: { toggleFavorito: jest.fn(), isFavorito: () => false },
    carros: {
      loading: appState.loading,
      carrosFiltrados: appState.carrosFiltrados,
      filtroAtivo: null,
      setFiltroAtivo: jest.fn(),
      searchQuery: '',
      setSearchQuery: jest.fn(),
      advPriceMin: null,
      setAdvPriceMin: jest.fn(),
      advPriceMax: null,
      setAdvPriceMax: jest.fn(),
      advDistrito: '',
      setAdvDistrito: jest.fn(),
      advConcelho: '',
      setAdvConcelho: jest.fn(),
      advRaioCentro: '',
      setAdvRaioCentro: jest.fn(),
      advRaioKm: null,
      setAdvRaioKm: jest.fn(),
      advBodyType: '',
      setAdvBodyType: jest.fn(),
      advCondition: '',
      setAdvCondition: jest.fn(),
      advCombustivel: '',
      setAdvCombustivel: jest.fn(),
      advCambio: '',
      setAdvCambio: jest.fn(),
      advSeatsMin: null,
      setAdvSeatsMin: jest.fn(),
      advTraction: '',
      setAdvTraction: jest.fn(),
      advFeatures: [],
      setAdvFeatures: jest.fn(),
      sortOrdem: null,
      setSortOrdem: jest.fn(),
    },
  }),
}));

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

describe('Home', () => {
  it('shows the server-provided listings while the realtime snapshot is still loading', () => {
    appState.loading = true;
    appState.carrosFiltrados = [];
    const initialCarros = [serializeCarro(buildCarro({ id: 'ssr-1', marca: 'Renault', modelo: 'Clio' }))];

    render(<Home initialCarros={initialCarros} />);

    expect(screen.getByRole('link', { name: /Renault Clio/ })).toHaveAttribute('href', '/detalhes/ssr-1');
  });

  it('switches to the live (filterable) list once the realtime snapshot arrives', () => {
    appState.loading = false;
    appState.carrosFiltrados = [buildCarro({ id: 'live-1', marca: 'Fiat', modelo: 'Punto' })];
    const initialCarros = [serializeCarro(buildCarro({ id: 'ssr-1', marca: 'Renault', modelo: 'Clio' }))];

    render(<Home initialCarros={initialCarros} />);

    expect(screen.getByRole('link', { name: /Fiat Punto/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Renault Clio/ })).not.toBeInTheDocument();
  });
});
