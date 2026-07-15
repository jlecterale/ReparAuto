import { weekKeyFromDate, getStoredAiRemaining, storeAiRemaining } from '@/lib/ia/aiQuota';

describe('weekKeyFromDate', () => {
  it('uses the Monday of the week (UTC) as the window key', () => {
    // 2026-07-01 is a Wednesday; its week starts Monday 2026-06-29.
    expect(weekKeyFromDate(new Date(Date.UTC(2026, 6, 1)))).toBe('w-2026-06-29');
  });

  it('maps a Sunday to the previous Monday', () => {
    expect(weekKeyFromDate(new Date(Date.UTC(2026, 6, 5)))).toBe('w-2026-06-29');
  });

  it('maps a Monday to itself', () => {
    expect(weekKeyFromDate(new Date(Date.UTC(2026, 5, 29)))).toBe('w-2026-06-29');
  });
});

describe('stored AI remaining (local UX counter only)', () => {
  it('returns null when nothing is stored for the user/week', () => {
    expect(getStoredAiRemaining('uid1', 'w-2026-06-29')).toBeNull();
  });

  it('round-trips the remaining count for a user/week', () => {
    storeAiRemaining('uid1', 'w-2026-06-29', 7);
    expect(getStoredAiRemaining('uid1', 'w-2026-06-29')).toBe(7);
  });

  it('ignores counts stored for another week (server derives the real window)', () => {
    storeAiRemaining('uid1', 'w-2026-06-22', 0);
    expect(getStoredAiRemaining('uid1', 'w-2026-06-29')).toBeNull();
  });
});
