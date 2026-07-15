import { accountLockCountry, docCountry, parseCountry } from '@/lib/country';

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

// Accounts belong to one market and lock the selector to it — except admins,
// who moderate both markets and keep the free selector everywhere.
describe('accountLockCountry', () => {
  it('locks a regular account to its market', () => {
    expect(accountLockCountry({ role: 'user', country: 'BR' })).toBe('BR');
  });

  it('locks legacy accounts without a country to PT', () => {
    expect(accountLockCountry({ role: 'user' })).toBe('PT');
  });

  it('never locks an admin, regardless of the account market', () => {
    expect(accountLockCountry({ role: 'admin', country: 'PT' })).toBeNull();
    expect(accountLockCountry({ role: 'admin', country: 'BR' })).toBeNull();
  });

  it('never locks anonymous visitors', () => {
    expect(accountLockCountry(null)).toBeNull();
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
