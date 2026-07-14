import { docCountry, parseCountry } from '@/lib/country';

// Multi-country isolation (plan 20): every listing/user doc carries a
// `country` key, but documents created before the Brazil launch have none —
// those are Portuguese by definition and must keep working unchanged.

describe('docCountry', () => {
  it('defaults legacy docs without a country to PT', () => {
    expect(docCountry({})).toBe('PT');
  });

  it('recognizes Brazilian docs', () => {
    expect(docCountry({ country: 'BR' })).toBe('BR');
  });

  it('treats unknown values as PT instead of hiding the doc', () => {
    expect(docCountry({ country: 'ES' })).toBe('PT');
    expect(docCountry({ country: null })).toBe('PT');
  });
});

describe('parseCountry', () => {
  it('parses a stored country preference', () => {
    expect(parseCountry('BR')).toBe('BR');
    expect(parseCountry('PT')).toBe('PT');
  });

  it('returns null when nothing is stored or the value is garbage', () => {
    expect(parseCountry(null)).toBeNull();
    expect(parseCountry('br')).toBeNull();
    expect(parseCountry('{}')).toBeNull();
  });
});
