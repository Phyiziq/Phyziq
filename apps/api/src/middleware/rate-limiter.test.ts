/**
 * rate-limiter.test.ts
 *
 * Tests for Redis-backed rate limiting middleware.
 * Uses a mock Redis client so no live Redis instance is required.
 *
 * Requirements validated: 11.1 (OTP brute-force protection, general API limits)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { rateLimiter, otpRateLimiter, _setRedisClient } from './rate-limiter.js';

// ── Mock Redis factory ─────────────────────────────────────────────────────

/**
 * Creates a minimal in-memory mock Redis client that tracks counters.
 */
function createMockRedis(opts: { failOnIncr?: boolean } = {}) {
  const counters = new Map<string, number>();
  const ttls = new Map<string, number>();

  return {
    incr: vi.fn(async (key: string): Promise<number> => {
      if (opts.failOnIncr) throw new Error('Redis connection refused');
      const current = (counters.get(key) ?? 0) + 1;
      counters.set(key, current);
      return current;
    }),
    expire: vi.fn(async (key: string, ttl: number): Promise<number> => {
      ttls.set(key, ttl);
      return 1;
    }),
    ttl: vi.fn(async (key: string): Promise<number> => {
      return ttls.get(key) ?? 3600;
    }),
    // Allow tests to pre-seed counters
    _set: (key: string, val: number) => counters.set(key, val),
    on: vi.fn(),
  };
}

// ── Request / Response helpers ─────────────────────────────────────────────

function makeReq(overrides: Partial<Request> = {}): Request {
  return {
    ip: '127.0.0.1',
    headers: {},
    body: {},
    ...overrides,
  } as unknown as Request;
}

function makeRes() {
  const headers: Record<string, string> = {};
  const setHeader = vi.fn((name: string, value: string) => {
    headers[name] = value;
  });
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  return { res: { setHeader, status, json } as unknown as Response, headers, status, json };
}

// ── otpRateLimiter ────────────────────────────────────────────────────────

describe('otpRateLimiter', () => {
  let mockRedis: ReturnType<typeof createMockRedis>;

  beforeEach(() => {
    mockRedis = createMockRedis();
    _setRedisClient(mockRedis as unknown as import('ioredis').default);
  });

  afterEach(() => {
    _setRedisClient(null);
  });

  it('allows the first 3 requests for a phone number', async () => {
    const phone = '+254700000001';
    const req = makeReq({ body: { phone } });

    for (let i = 0; i < 3; i++) {
      const { res } = makeRes();
      const next = vi.fn() as NextFunction;
      await otpRateLimiter(req, res, next);
      expect(next).toHaveBeenCalledWith(); // called without error arg
    }
  });

  it('blocks the 4th request for a phone number with 429', async () => {
    const phone = '+254700000002';
    // Seed the counter to 3 (already used all 3 attempts)
    const key = `rl:otp:${phone}`;
    mockRedis._set(key, 3);

    const req = makeReq({ body: { phone } });
    const { res, status, json } = makeRes();
    const next = vi.fn() as NextFunction;

    await otpRateLimiter(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(429);
    const body = json.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(body['success']).toBe(false);
    expect((body['error'] as Record<string, unknown>)['code']).toBe('RATE_LIMIT_EXCEEDED');
  });

  it('includes Retry-After header when limit is exceeded', async () => {
    const phone = '+254700000003';
    const key = `rl:otp:${phone}`;
    mockRedis._set(key, 3);
    // Set a known TTL
    mockRedis.ttl.mockResolvedValueOnce(1800);

    const req = makeReq({ body: { phone } });
    const { res } = makeRes();
    const retryAfterValues: string[] = [];
    (res.setHeader as ReturnType<typeof vi.fn>).mockImplementation(
      (name: string, val: string) => {
        if (name === 'Retry-After') retryAfterValues.push(val);
      }
    );
    const next = vi.fn() as NextFunction;

    await otpRateLimiter(req, res, next);

    expect(retryAfterValues).toContain('1800');
  });

  it('calls next() when phone is not provided (let schema handle it)', async () => {
    const req = makeReq({ body: {} });
    const { res } = makeRes();
    const next = vi.fn() as NextFunction;

    await otpRateLimiter(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });
});

// ── rateLimiter ───────────────────────────────────────────────────────────

describe('rateLimiter', () => {
  let mockRedis: ReturnType<typeof createMockRedis>;

  beforeEach(() => {
    mockRedis = createMockRedis();
    _setRedisClient(mockRedis as unknown as import('ioredis').default);
  });

  afterEach(() => {
    _setRedisClient(null);
  });

  it('allows up to 1000 requests', async () => {
    const ip = '10.0.0.1';
    const key = `rl:general:${ip}`;
    // Seed to 999 — next increment puts it at 1000 (still allowed)
    mockRedis._set(key, 999);

    const req = makeReq({ ip });
    const { res } = makeRes();
    const next = vi.fn() as NextFunction;

    await rateLimiter(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('blocks the 1001st request with 429', async () => {
    const ip = '10.0.0.2';
    const key = `rl:general:${ip}`;
    // Seed to 1000 — next increment puts it at 1001 (blocked)
    mockRedis._set(key, 1000);

    const req = makeReq({ ip });
    const { res, status, json } = makeRes();
    const next = vi.fn() as NextFunction;

    await rateLimiter(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(429);
    const body = json.mock.calls[0]?.[0] as Record<string, unknown>;
    expect((body['error'] as Record<string, unknown>)['code']).toBe('RATE_LIMIT_EXCEEDED');
  });

  it('uses JWT sub as identifier when Bearer token is present', async () => {
    // Build a minimal JWT with sub = 'user-123'
    const payload = Buffer.from(JSON.stringify({ sub: 'user-123' })).toString('base64url');
    const fakeJwt = `header.${payload}.sig`;
    const req = makeReq({ headers: { authorization: `Bearer ${fakeJwt}` } });
    const { res } = makeRes();
    const next = vi.fn() as NextFunction;

    await rateLimiter(req, res, next);

    // incr should be called with the JWT-based key
    expect(mockRedis.incr).toHaveBeenCalledWith('rl:general:user-123');
    expect(next).toHaveBeenCalledWith();
  });

  it('falls back to IP when no Authorization header', async () => {
    const req = makeReq({ ip: '192.168.1.50', headers: {} });
    const { res } = makeRes();
    const next = vi.fn() as NextFunction;

    await rateLimiter(req, res, next);

    expect(mockRedis.incr).toHaveBeenCalledWith('rl:general:192.168.1.50');
    expect(next).toHaveBeenCalledWith();
  });
});

// ── Fail-open (Redis unreachable) ─────────────────────────────────────────

describe('fail-open behaviour when Redis is unreachable', () => {
  beforeEach(() => {
    const failingRedis = createMockRedis({ failOnIncr: true });
    _setRedisClient(failingRedis as unknown as import('ioredis').default);
  });

  afterEach(() => {
    _setRedisClient(null);
  });

  it('otpRateLimiter allows request through when Redis is down', async () => {
    const req = makeReq({ body: { phone: '+254700000099' } });
    const { res } = makeRes();
    const next = vi.fn() as NextFunction;

    await otpRateLimiter(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('rateLimiter allows request through when Redis is down', async () => {
    const req = makeReq({ ip: '10.10.10.10' });
    const { res } = makeRes();
    const next = vi.fn() as NextFunction;

    await rateLimiter(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });
});
