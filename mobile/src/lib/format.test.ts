import { describe, it, expect } from '@jest/globals';
import { formatPreco, formatPrecoOpcional } from '@/lib/format';

describe('formatPrecoOpcional', () => {
  it('shows "Sob consulta" when there is no usable price', () => {
    expect(formatPrecoOpcional(null)).toBe('Sob consulta');
    expect(formatPrecoOpcional(undefined)).toBe('Sob consulta');
    expect(formatPrecoOpcional(0)).toBe('Sob consulta');
  });

  it('formats a real price with the euro symbol', () => {
    const out = formatPrecoOpcional(1500);
    expect(out).toContain('€');
    expect(out).toMatch(/1.?500/);
  });
});

describe('formatPreco', () => {
  it('renders an integer euro amount with the currency symbol', () => {
    const out = formatPreco(2500);
    expect(out).toContain('€');
    expect(out).toMatch(/2.?500/);
  });
});
