import { term } from '@/lib/terms';

// Plan 20: the same interface reads naturally in both markets — Portuguese
// users see "Telemóvel"/"Concelho", Brazilian users see "Celular"/"Cidade".

describe('term', () => {
  it('resolves a label for each market', () => {
    expect(term('phoneLabel', 'PT')).toBe('Telemóvel');
    expect(term('phoneLabel', 'BR')).toBe('Celular');
    expect(term('municipalityLabel', 'PT')).toBe('Concelho');
    expect(term('municipalityLabel', 'BR')).toBe('Cidade');
  });
});
