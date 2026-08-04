/**
 * rate-limiter.ts — Redis-backed rate limiting middleware
 *
 * Implements sliding-window rate limiting using Redis INCR + EXPIRE.
 *
 * Limits:
 *   rateLimiter    — 1 000 req/hour per JWT sub (or IP fallback)  [Req 11.1]
 *   otpRateLimiter — 3 req/hour per phone number                  [Req 11.1]
 *
 * Fail-open: if Redis is unreachable, requests are allowed through and
 * the error is logged. This prevents Redis downtime from taking down the API.
 *
 * Key format:
 *   rl:general:{identifier}   — JWT sub or IP
 *   rl:otp:{phone}            — phone from req.body.phone
 *
 * TTL: 3 600 seconds (1 hour rolling window, reset on first hit in window)
 */

import { NextFunction, Request, Response } from 'express';
import Redis from 'ioredis';
import type { ApiError } from '@phyziq/shared';

// ─── Redis client factory ──────────────────────────────────────────────────

let _redis: Redis | null = null;

/**
 * Returns a shared ioredis client, lazily created on first call.
 * Exported so other modules (auth, etc.) can reuse the same connection.
 */
export function createRedisClient(): Redis {
  if (_redis) return _redis;

  const url = process.env['REDIS_URL'] ?? 'redis://localhost:6379';
  const client = new Redis(url, {
    // Disable auto-reconnect spam in test environments
    maxRetriesPerRequest: process.env['NODE_ENV'] === 'test' ? 0 : 3,
    lazyConnect: true,
    // Prevent unhandled rejection crashes
    enableOfflineQueue: false,
  });

  client.on('error', (err: Error) => {
    console.error('[Redis] Connection error:', err.message);
  });

  _redis = client;
  return client;
}

/**
 * Exposed for testing — allows injecting a mock Redis client.
 * @internal
 */
export function _setRedisClient(client: Redis | null): void {
  _redis = client;
}

// ─── Core sliding-window helper ───────────────────────────────────────────

/**
 * Increments the counter for `key` and sets a 1-hour TTL on first hit.
 * Returns the current count, or null if Redis is unreachable.
 */
async function increment(key: string): Promise<number | null> {
  const redis = createRedisClient();
  try {
    const count = await redis.incr(key);
    if (count === 1) {
      // First request in the window — set TTL
      await redis.expire(key, 3600);
    }
    return count;
  } catch (err) {
    console.error('[RateLimiter] Redis error (fail-open):', (err as Error).message);
    return null;
  }
}

/**
 * Gets the remaining TTL in seconds for a rate-limit key.
 * Returns 3600 on any error.
 */
async function getTtl(key: string): Promise<number> {
  const redis = createRedisClient();
  try {
    const ttl = await redis.ttl(key);
    return ttl > 0 ? ttl : 3600;
  } catch {
    return 3600;
  }
}

// ─── Rate limit response helper ───────────────────────────────────────────

function sendRateLimitExceeded(res: Response, retryAfter: number): void {
  const body: ApiError = {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
    },
  };
  res.setHeader('Retry-After', String(retryAfter));
  res.status(429).json(body);
}

// ─── General API rate limiter ─────────────────────────────────────────────

/**
 * General rate limiter: 1 000 requests/hour.
 * Identifier: JWT `sub` claim from Bearer token, or remote IP as fallback.
 */
export async function rateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const identifier = extractJwtSub(req) ?? req.ip ?? 'unknown';
  const key = `rl:general:${identifier}`;
  const limit = 1000;

  const count = await increment(key);

  // Fail-open: if Redis is down, allow the request
  if (count === null) {
    next();
    return;
  }

  if (count > limit) {
    const retryAfter = await getTtl(key);
    sendRateLimitExceeded(res, retryAfter);
    return;
  }

  res.setHeader('X-RateLimit-Limit', String(limit));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, limit - count)));
  next();
}

// ─── OTP rate limiter ─────────────────────────────────────────────────────

/**
 * OTP rate limiter: 3 requests/hour per phone number.
 * Phone is extracted from `req.body.phone` (set by JSON body parser before
 * this middleware runs).
 */
export async function otpRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const phone = (req.body as { phone?: unknown }).phone;
  const limit = 3;

  if (typeof phone !== 'string' || phone.trim() === '') {
    // No phone — let the route handler's Zod schema reject it
    next();
    return;
  }

  const key = `rl:otp:${phone.trim()}`;
  const count = await increment(key);

  // Fail-open
  if (count === null) {
    next();
    return;
  }

  if (count > limit) {
    const retryAfter = await getTtl(key);
    sendRateLimitExceeded(res, retryAfter);
    return;
  }

  res.setHeader('X-RateLimit-Limit', String(limit));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, limit - count)));
  next();
}

// ─── JWT helper ───────────────────────────────────────────────────────────

/**
 * Extracts the `sub` claim from a Bearer JWT without verifying the signature.
 * Verification happens in the auth middleware. Here we only need the sub
 * for rate-limit keying.
 */
function extractJwtSub(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(parts[1] as string, 'base64url').toString('utf8')
    ) as Record<string, unknown>;
    return typeof payload['sub'] === 'string' ? payload['sub'] : null;
  } catch {
    return null;
  }
}
