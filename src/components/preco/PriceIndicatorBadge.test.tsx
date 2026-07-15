import { render, screen } from '@testing-library/react';
import PriceIndicatorBadge from './PriceIndicatorBadge';

describe('PriceIndicatorBadge', () => {
  it('formats the diff with € for a PT listing (default market)', () => {
    render(<PriceIndicatorBadge indicator="acima" deviation={0.1} diffValue={500} />);
    expect(screen.getByText('(+500 €)')).toBeInTheDocument();
  });

  it('formats the diff with R$ for a BR listing', () => {
    render(<PriceIndicatorBadge indicator="acima" deviation={0.1} diffValue={5000} country="BR" />);
    expect(screen.getByText('(+R$ 5.000)')).toBeInTheDocument();
  });

  it('shows a minus sign and the currency for a below-median PT listing', () => {
    render(<PriceIndicatorBadge indicator="bom" deviation={-0.1} diffValue={-500} country="PT" />);
    expect(screen.getByText('(−500 €)')).toBeInTheDocument();
  });

  it('falls back to a percentage when no diffValue is given', () => {
    render(<PriceIndicatorBadge indicator="acima" deviation={0.15} />);
    expect(screen.getByText('(+15%)')).toBeInTheDocument();
  });

  it('compact mode never renders a currency value regardless of country', () => {
    render(<PriceIndicatorBadge indicator="acima" deviation={0.1} diffValue={5000} country="BR" compact />);
    expect(screen.queryByText(/R\$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/€/)).not.toBeInTheDocument();
  });

  it('shows no diff text at all for "indisponivel"', () => {
    render(<PriceIndicatorBadge indicator="indisponivel" diffValue={500} country="BR" />);
    expect(screen.queryByText(/R\$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/€/)).not.toBeInTheDocument();
  });
});
