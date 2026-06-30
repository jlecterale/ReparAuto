import {
  hasSeenOnboarding,
  markOnboardingSeen,
  setPendingIntent,
  getPendingIntent,
  clearPendingIntent,
} from '@/lib/onboarding';

// jest.setup.ts clears localStorage before each test, so every case starts fresh.

describe('onboarding "seen" flag', () => {
  it('is false for a first-time visitor', () => {
    expect(hasSeenOnboarding()).toBe(false);
  });

  it('is true after the welcome tour is marked seen', () => {
    markOnboardingSeen();
    expect(hasSeenOnboarding()).toBe(true);
  });
});

describe('pending intent (signup → setup-perfil resume)', () => {
  it('returns null when nothing was stashed', () => {
    expect(getPendingIntent()).toBeNull();
  });

  it('round-trips the chosen creation flow', () => {
    setPendingIntent('/anunciar');
    expect(getPendingIntent()).toBe('/anunciar');
  });

  it('is cleared explicitly', () => {
    setPendingIntent('/anunciar');
    clearPendingIntent();
    expect(getPendingIntent()).toBeNull();
  });

  it('expires after the 10-minute TTL', () => {
    jest.useFakeTimers();
    try {
      jest.setSystemTime(new Date('2026-06-30T10:00:00Z'));
      setPendingIntent('/anunciar');

      // Just before the TTL it still resolves.
      jest.setSystemTime(new Date('2026-06-30T10:09:59Z'));
      expect(getPendingIntent()).toBe('/anunciar');

      // Past the 10-minute window it self-expires.
      jest.setSystemTime(new Date('2026-06-30T10:10:01Z'));
      expect(getPendingIntent()).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  it('reading an expired intent also removes it from storage', () => {
    jest.useFakeTimers();
    try {
      jest.setSystemTime(new Date('2026-06-30T10:00:00Z'));
      setPendingIntent('/anunciar');
      jest.setSystemTime(new Date('2026-06-30T11:00:00Z'));
      getPendingIntent(); // triggers cleanup
      expect(localStorage.getItem('reparauto_pending_intent')).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  it('returns null for a corrupt stored value instead of throwing', () => {
    localStorage.setItem('reparauto_pending_intent', 'not-json');
    expect(getPendingIntent()).toBeNull();
  });

  it('returns null when the stored entry has no path', () => {
    localStorage.setItem('reparauto_pending_intent', JSON.stringify({ ts: Date.now() }));
    expect(getPendingIntent()).toBeNull();
  });
});
