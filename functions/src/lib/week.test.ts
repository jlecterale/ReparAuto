import { weekKeyFromDate } from './week';

describe('weekKeyFromDate (server-side quota window)', () => {
  it('uses the Monday of the week (UTC) as the window key', () => {
    expect(weekKeyFromDate(new Date(Date.UTC(2026, 6, 1)))).toBe('w-2026-06-29');
  });

  it('maps a Sunday to the previous Monday', () => {
    expect(weekKeyFromDate(new Date(Date.UTC(2026, 6, 5)))).toBe('w-2026-06-29');
  });

  it('crosses month/year boundaries correctly', () => {
    // Thursday 2026-01-01 belongs to the week starting Monday 2025-12-29.
    expect(weekKeyFromDate(new Date(Date.UTC(2026, 0, 1)))).toBe('w-2025-12-29');
  });
});
