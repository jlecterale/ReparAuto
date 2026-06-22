import { describe, it, expect } from '@jest/globals';
import {
  motorMatches,
  entryMatchesCar,
  pecaCompatibleWithCar,
  pecasShareCompatibility,
  formatCompatibilityEntry,
  pickDefined,
} from '@/lib/compatibility';
import type { CompatibilityEntry, Peca } from '@/types/peca';
import type { Carro } from '@/types/carro';

// Minimal fixtures: these functions only read a handful of fields, so we cast
// partials instead of building full Carro/Peca objects.
const carro = (p: Partial<Carro>): Carro => p as Carro;
const peca = (p: Partial<Peca>): Peca => p as Peca;

describe('motorMatches', () => {
  it('treats a missing reference motor as a wildcard', () => {
    expect(motorMatches(undefined, '2.0 TDI')).toBe(true);
  });

  it('matches when every reference token is a prefix of a candidate token', () => {
    expect(motorMatches('1.6', '1.6 TDI')).toBe(true);
  });

  it('does not match a different engine displacement', () => {
    expect(motorMatches('2.0', '1.6')).toBe(false);
  });

  it('does not match when the candidate motor is empty', () => {
    expect(motorMatches('tdi', '')).toBe(false);
  });
});

describe('entryMatchesCar', () => {
  const entry: CompatibilityEntry = { marca: 'BMW', modelo: '320', anoInicio: 2010, anoFim: 2015 };

  it('matches a car within brand, model and year range (case-insensitive)', () => {
    expect(entryMatchesCar(entry, carro({ marca: 'bmw', modelo: '320d', anoFabricacao: 2012 }))).toBe(true);
  });

  it('rejects a car built after the year range', () => {
    expect(entryMatchesCar(entry, carro({ marca: 'BMW', modelo: '320', anoFabricacao: 2020 }))).toBe(false);
  });

  it('rejects a different brand', () => {
    expect(entryMatchesCar(entry, carro({ marca: 'Audi', modelo: '320', anoFabricacao: 2012 }))).toBe(false);
  });
});

describe('pecaCompatibleWithCar', () => {
  it('uses explicit compatibility entries when present', () => {
    const p = peca({ compatibilidades: [{ marca: 'BMW', modelo: '320', anoInicio: 2010, anoFim: 2015 }] });
    expect(pecaCompatibleWithCar(p, carro({ marca: 'BMW', modelo: '320d', anoFabricacao: 2012 }))).toBe(true);
  });

  it('falls back to marcaCarro/modeloCarro when there are no entries', () => {
    const p = peca({ marcaCarro: 'BMW', modeloCarro: '320' });
    expect(pecaCompatibleWithCar(p, carro({ marca: 'BMW', modelo: '320d', anoFabricacao: 2012 }))).toBe(true);
  });

  it('returns false when the part carries no brand information', () => {
    expect(pecaCompatibleWithCar(peca({}), carro({ marca: 'BMW' }))).toBe(false);
  });
});

describe('pecasShareCompatibility', () => {
  it('matches two parts whose brand/model/year scopes overlap', () => {
    const a = peca({ categoria: 'Motor', compatibilidades: [{ marca: 'BMW', modelo: '320', anoInicio: 2010, anoFim: 2018 }] });
    const b = peca({ categoria: 'Motor', compatibilidades: [{ marca: 'BMW', modelo: '320', anoInicio: 2015, anoFim: 2020 }] });
    expect(pecasShareCompatibility(a, b)).toBe(true);
  });

  it('does not match parts from different categories', () => {
    const a = peca({ categoria: 'Motor', marcaCarro: 'BMW' });
    const b = peca({ categoria: 'Suspensão', marcaCarro: 'BMW' });
    expect(pecasShareCompatibility(a, b)).toBe(false);
  });
});

describe('formatCompatibilityEntry', () => {
  it('joins brand, model, year range and motor with a middot', () => {
    expect(
      formatCompatibilityEntry({ marca: 'BMW', modelo: '320', anoInicio: 2010, anoFim: 2015, motor: '2.0d' }),
    ).toBe('BMW · 320 · 2010-2015 · 2.0d');
  });

  it('renders an open-ended lower bound', () => {
    expect(formatCompatibilityEntry({ marca: 'Audi', anoInicio: 2010 })).toBe('Audi · ≥ 2010');
  });
});

describe('pickDefined', () => {
  it('drops undefined values but keeps null and other falsy values', () => {
    expect(pickDefined({ a: 1, b: undefined, c: null, d: 0 })).toEqual({ a: 1, c: null, d: 0 });
  });
});
