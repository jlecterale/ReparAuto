import { describe, it, expect } from '@jest/globals';
import {
  haversineKm,
  getConcelhos,
  getAllConcelhos,
  DISTRITOS,
  CENTRO_PORTUGAL,
} from '@/lib/geo';

describe('haversineKm', () => {
  it('returns 0 for identical coordinates', () => {
    expect(haversineKm({ lat: 38.72, lng: -9.14 }, { lat: 38.72, lng: -9.14 })).toBe(0);
  });

  it('approximates the Lisbon→Porto distance (~270-320 km)', () => {
    const d = haversineKm({ lat: 38.7223, lng: -9.1393 }, { lat: 41.1496, lng: -8.6109 });
    expect(d).toBeGreaterThan(270);
    expect(d).toBeLessThan(320);
  });

  it('is symmetric', () => {
    const a = { lat: 38.72, lng: -9.14 };
    const b = { lat: 41.15, lng: -8.61 };
    expect(haversineKm(a, b)).toBeCloseTo(haversineKm(b, a), 6);
  });
});

describe('district / concelho lookup', () => {
  it('exposes a non-empty list of districts', () => {
    expect(DISTRITOS.length).toBeGreaterThan(0);
  });

  it('returns an empty list for an unknown district', () => {
    expect(getConcelhos('Atlântida')).toEqual([]);
  });

  it('lists concelhos across the country', () => {
    expect(getAllConcelhos().length).toBeGreaterThan(0);
  });

  it('places the Portugal centroid in a plausible latitude range', () => {
    expect(CENTRO_PORTUGAL.lat).toBeGreaterThan(36);
    expect(CENTRO_PORTUGAL.lat).toBeLessThan(43);
  });
});
