import { simplifyFipeModelName, dedupeModelNames } from '@/lib/fipe';

// FIPE returns trim-level names ("AMAROK CD2.0 16V TDI 4x4 Die"). The
// marketplace filters and matches on base model names, so the trim/spec tail
// is cut and duplicates collapse into one entry per model.

describe('simplifyFipeModelName', () => {
  it('cuts the name at the first spec token (digits/engine size)', () => {
    expect(simplifyFipeModelName('AMAROK CD2.0 16V TDI 4x4 Die')).toBe('Amarok');
    expect(simplifyFipeModelName('Gol 1.0 Plus 16v')).toBe('Gol');
  });

  it('keeps multi-word model names up to the spec tail', () => {
    expect(simplifyFipeModelName('Santa Fé 2.7 V6 4x4')).toBe('Santa Fé');
  });

  it('cuts short all-caps trim codes after the first word', () => {
    expect(simplifyFipeModelName('Golf GTI 2.0')).toBe('Golf');
  });

  it('keeps purely numeric model names (Peugeot 206)', () => {
    expect(simplifyFipeModelName('206 Soleil 1.6')).toBe('206');
  });
});

describe('dedupeModelNames', () => {
  it('collapses trims into unique sorted base models', () => {
    expect(
      dedupeModelNames(['Gol 1.0 Plus', 'GOL 1.6 Power', 'Polo 1.4', 'Amarok CD2.0'])
    ).toEqual(['Amarok', 'Gol', 'Polo']);
  });
});
