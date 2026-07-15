import { render, screen, fireEvent } from '@testing-library/react';
import CarCard from './CarCard';
import { buildCarro } from '@/test/factories';

const mockToggleFavorito = jest.fn();

jest.mock('../../providers/AppProvider', () => ({
  useApp: () => ({
    favoritos: { toggleFavorito: mockToggleFavorito, isFavorito: () => false },
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

afterEach(() => {
  jest.clearAllMocks();
});

describe('CarCard', () => {
  it('is a real link to the listing detail page (prefetchable and crawlable)', () => {
    render(<CarCard carro={buildCarro({ id: 'abc123', marca: 'Renault', modelo: 'Clio' })} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/detalhes/abc123');
    expect(link).toHaveTextContent('Renault Clio');
  });

  it('mostra "bairro, cidade" quando o anúncio brasileiro tem bairro', () => {
    render(<CarCard carro={buildCarro({ local: 'São Paulo', bairro: 'Bela Vista', country: 'BR' })} />);

    expect(screen.getByText('Bela Vista, São Paulo')).toBeInTheDocument();
  });

  it('mostra só a cidade quando não há bairro', () => {
    render(<CarCard carro={buildCarro({ local: 'Braga' })} />);

    expect(screen.getByText('Braga')).toBeInTheDocument();
  });

  it('toggles the favourite without triggering the card navigation', () => {
    render(<CarCard carro={buildCarro({ id: 'abc123' })} />);

    const heart = screen.getByRole('button');
    const notPrevented = fireEvent.click(heart);

    expect(mockToggleFavorito).toHaveBeenCalledWith('abc123');
    // fireEvent returns false when preventDefault() was called — the click
    // must not bubble into the surrounding link and navigate.
    expect(notPrevented).toBe(false);
  });
});
