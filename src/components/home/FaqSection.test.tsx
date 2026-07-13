import { render, screen } from '@testing-library/react';
import FaqSection from './FaqSection';

// Controlled per test: the page query string and the CountryProvider market.
let mockSearch = '';
let mockCountry: 'PT' | 'BR' = 'PT';

jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(mockSearch),
}));

jest.mock('../../providers/CountryProvider', () => ({
  useCountry: () => ({
    country: mockCountry,
    setCountry: jest.fn(),
    locked: false,
    setLocked: jest.fn(),
  }),
}));

const standvirtualQuestion = () =>
  screen.queryByRole('button', { name: /Standvirtual/i });

// Guards against over-filtering: the market filter must only drop the
// Standvirtual entry, never the market-agnostic questions.
const expectOtherQuestionsVisible = () => {
  expect(screen.getAllByRole('button', { name: /\?$/ })).toHaveLength(4);
};

describe('FaqSection', () => {
  beforeEach(() => {
    mockSearch = '';
    mockCountry = 'PT';
  });

  it('shows the Standvirtual question for the Portuguese market', () => {
    render(<FaqSection />);

    expect(standvirtualQuestion()).toBeInTheDocument();
  });

  it('hides the Standvirtual question for the Brazilian market', () => {
    mockCountry = 'BR';
    render(<FaqSection />);

    expect(standvirtualQuestion()).not.toBeInTheDocument();
    expectOtherQuestionsVisible();
  });

  it('lets ?mercado=BR override a PT provider market (account market wins)', () => {
    mockCountry = 'PT';
    mockSearch = 'mercado=BR';
    render(<FaqSection />);

    expect(standvirtualQuestion()).not.toBeInTheDocument();
    expectOtherQuestionsVisible();
  });

  it('lets ?mercado=PT override a BR provider market', () => {
    mockCountry = 'BR';
    mockSearch = 'mercado=PT';
    render(<FaqSection />);

    expect(standvirtualQuestion()).toBeInTheDocument();
  });

  it('ignores an invalid ?mercado= value and falls back to the provider market', () => {
    mockCountry = 'BR';
    mockSearch = 'mercado=XX';
    render(<FaqSection />);

    expect(standvirtualQuestion()).not.toBeInTheDocument();
    expectOtherQuestionsVisible();
  });
});
