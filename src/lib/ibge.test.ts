import { toTitleCasePt, ufForEstado } from '@/lib/ibge';

// IBGE returns municipality names uppercased; we render them in title case with
// Portuguese connectors kept lowercase, and map each state to its UF for the API.
describe('toTitleCasePt', () => {
  it('title-cases a single-word name', () => {
    expect(toTitleCasePt('RIO BRANCO')).toBe('Rio Branco');
  });

  it('keeps Portuguese connectors lowercase (except leading)', () => {
    expect(toTitleCasePt('MOGI DAS CRUZES')).toBe('Mogi das Cruzes');
    expect(toTitleCasePt('SÃO JOÃO DE MERITI')).toBe('São João de Meriti');
  });

  it('preserves accents', () => {
    expect(toTitleCasePt('SÃO PAULO')).toBe('São Paulo');
    expect(toTitleCasePt('BRASILÉIA')).toBe('Brasiléia');
  });
});

describe('ufForEstado', () => {
  it('maps full state names to their UF', () => {
    expect(ufForEstado('São Paulo')).toBe('SP');
    expect(ufForEstado('Rio de Janeiro')).toBe('RJ');
    expect(ufForEstado('Distrito Federal')).toBe('DF');
  });

  it('returns undefined for an unknown state', () => {
    expect(ufForEstado('Lisboa')).toBeUndefined();
  });
});
