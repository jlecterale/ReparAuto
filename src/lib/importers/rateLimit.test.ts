import { createRateLimiter } from '@/lib/importers/rateLimit';

describe('createRateLimiter', () => {
  it('allows up to `max` hits inside the window and rejects the next one', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 3 });
    expect(limiter.check('user-1', 0).allowed).toBe(true);
    expect(limiter.check('user-1', 1_000).allowed).toBe(true);
    expect(limiter.check('user-1', 2_000).allowed).toBe(true);
    const rejected = limiter.check('user-1', 3_000);
    expect(rejected.allowed).toBe(false);
    expect(rejected.retryAfterMs).toBe(57_000); // first hit leaves the window at t=60s
  });

  it('lets hits through again once the window slides past old entries', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 2 });
    limiter.check('user-1', 0);
    limiter.check('user-1', 30_000);
    expect(limiter.check('user-1', 59_999).allowed).toBe(false);
    expect(limiter.check('user-1', 60_001).allowed).toBe(true);
  });

  it('tracks each key independently', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 1 });
    expect(limiter.check('user-1', 0).allowed).toBe(true);
    expect(limiter.check('user-2', 0).allowed).toBe(true);
    expect(limiter.check('user-1', 1).allowed).toBe(false);
  });

  it('does not count rejected hits against the window', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 1 });
    limiter.check('user-1', 0);
    limiter.check('user-1', 10_000); // rejected — must not extend the block
    expect(limiter.check('user-1', 60_001).allowed).toBe(true);
  });
});
