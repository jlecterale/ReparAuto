import { lisbonDateKey, lisbonDateWindow } from '@/lib/dates';

// Daily metric buckets for the professional dashboard are keyed by the
// calendar day in Europe/Lisbon. The window builder must produce one key per
// calendar day — including across DST transitions, where naive 24h stepping
// skips (spring) or duplicates (fall) a date.

describe('lisbonDateKey', () => {
  it('formats an instant as YYYY-MM-DD in Europe/Lisbon', () => {
    expect(lisbonDateKey(new Date('2026-07-01T12:00:00Z'))).toBe('2026-07-01');
  });

  it('rolls to the next day at Lisbon midnight, not UTC midnight', () => {
    // 23:30 UTC in summer = 00:30 Lisbon (WEST, UTC+1) on the next day.
    expect(lisbonDateKey(new Date('2026-06-30T23:30:00Z'))).toBe('2026-07-01');
  });
});

describe('lisbonDateWindow', () => {
  it('returns `days` consecutive dates ending on the reference day', () => {
    const win = lisbonDateWindow(3, new Date('2026-07-01T12:00:00Z'));
    expect(win).toEqual(['2026-06-29', '2026-06-30', '2026-07-01']);
  });

  it('crosses month and year boundaries', () => {
    const win = lisbonDateWindow(3, new Date('2026-01-01T12:00:00Z'));
    expect(win).toEqual(['2025-12-30', '2025-12-31', '2026-01-01']);
  });

  it('does not skip the spring-forward day (DST start)', () => {
    // 2026-03-29 is the Lisbon spring-forward day. Reference: 00:30 local on
    // 2026-03-30 (= 2026-03-29T23:30Z) — the case where 24h stepping skips it.
    const win = lisbonDateWindow(4, new Date('2026-03-29T23:30:00Z'));
    expect(win).toEqual(['2026-03-27', '2026-03-28', '2026-03-29', '2026-03-30']);
  });

  it('does not duplicate the fall-back day (DST end)', () => {
    // 2026-10-25 is the Lisbon fall-back day. Reference: 23:30 local that day.
    const win = lisbonDateWindow(4, new Date('2026-10-25T23:30:00Z'));
    expect(win).toEqual(['2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25']);
    expect(new Set(win).size).toBe(win.length);
  });
});
