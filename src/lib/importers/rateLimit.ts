/**
 * Minimal in-memory sliding-window rate limiter for the import API routes.
 * Per-instance and best-effort by design: App Hosting runs few instances and
 * the goal is stopping one user from hammering Standvirtual through us, not
 * accounting-grade quotas.
 */

export interface RateLimitResult {
  allowed: boolean;
  /** When rejected: how long until the oldest hit leaves the window. */
  retryAfterMs?: number;
}

export interface RateLimiter {
  check(key: string, now?: number): RateLimitResult;
}

export function createRateLimiter(options: { windowMs: number; max: number }): RateLimiter {
  const { windowMs, max } = options;
  const hitsByKey = new Map<string, number[]>();

  return {
    check(key: string, now: number = Date.now()): RateLimitResult {
      const hits = (hitsByKey.get(key) ?? []).filter((at) => at > now - windowMs);
      if (hits.length >= max) {
        hitsByKey.set(key, hits);
        return { allowed: false, retryAfterMs: hits[0] + windowMs - now };
      }
      hits.push(now);
      hitsByKey.set(key, hits);
      return { allowed: true };
    },
  };
}
