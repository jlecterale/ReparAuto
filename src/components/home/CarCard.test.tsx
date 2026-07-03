import { render, screen, fireEvent } from '@testing-library/react';
import CarCard from './CarCard';
import { resetCompareStoreForTests } from '@/hooks/useCompare';
import { buildCarro } from '@/test/factories';

const mockToggleFavorito = jest.fn();
let mockVerifiedUids = new Set<string>();

jest.mock('../../providers/AppProvider', () => ({
  useApp: () => ({
    favoritos: { toggleFavorito: mockToggleFavorito, isFavorito: () => false },
    carros: { verifiedUids: mockVerifiedUids },
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
  mockVerifiedUids = new Set();
  resetCompareStoreForTests();
});

describe('CarCard', () => {
  it('is a real link to the listing detail page (prefetchable and crawlable)', () => {
    render(<CarCard carro={buildCarro({ id: 'abc123', marca: 'Renault', modelo: 'Clio' })} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/detalhes/abc123');
    expect(link).toHaveTextContent('Renault Clio');
  });

  it('toggles the favourite without triggering the card navigation', () => {
    render(<CarCard carro={buildCarro({ id: 'abc123' })} />);

    const heart = screen.getByRole('button', { name: 'Adicionar aos favoritos' });
    const notPrevented = fireEvent.click(heart);

    expect(mockToggleFavorito).toHaveBeenCalledWith('abc123');
    // fireEvent returns false when preventDefault() was called — the click
    // must not bubble into the surrounding link and navigate.
    expect(notPrevented).toBe(false);
  });

  it('toggles the comparison without triggering the card navigation', () => {
    render(<CarCard carro={buildCarro({ id: 'abc123' })} />);

    const compare = screen.getByRole('button', { name: 'Adicionar à comparação' });
    const notPrevented = fireEvent.click(compare);

    expect(notPrevented).toBe(false);
    expect(
      screen.getByRole('button', { name: 'Remover da comparação' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows the verified badge when the seller is verified', () => {
    mockVerifiedUids = new Set(['seller-1']);
    render(<CarCard carro={buildCarro({ id: 'abc123', criadorUid: 'seller-1' })} />);

    expect(screen.getByRole('img', { name: 'Verificado' })).toBeInTheDocument();
  });
});
