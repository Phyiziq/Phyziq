/**
 * app.ts — Express application factory
 *
 * Creates and returns a configured Express application instance.
 * Separating the factory from the server entry point (index.ts) makes
 * the app testable without binding to a port.
 *
 * Middleware order (matters for correctness):
 *   1. helmet          — security headers (HSTS, CSP, X-Frame-Options…)  [Req 11.8]
 *   2. cors            — CORS allowlist with credentials support
 *   3. express.json    — JSON body parsing (limit 1 MB)
 *   4. urlencoded      — form body parsing
 *   5. compression     — gzip/Brotli at 10 KB threshold                  [Req 10.6]
 *   6. rateLimiter     — 1 000 req/hour general limit                    [Req 11.1]
 *   7. Routes          — health check + future module routers
 *   8. errorHandler    — global JSON error handler (must be last)
 */

import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { rateLimiter } from './middleware/rate-limiter.js';
import { errorHandler } from './middleware/error-handler.js';

import { authRouter } from './modules/auth/index.js';
import { onboardingRouter } from './modules/onboarding/index.js';
import { consentRouter } from './modules/consent/index.js';

const CORS_ALLOWLIST = [
  'https://phyziq.com',
  'https://www.phyziq.com',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:8081',
];

export function createApp(): express.Application {
  const app = express();

  // ── 1. Security headers ────────────────────────────────────────────────
  // helmet sets HSTS, X-Content-Type-Options, X-Frame-Options, CSP, etc.
  // This complements TLS termination at the Cloudflare/load-balancer edge [Req 11.8]
  app.use(helmet());

  // ── 2. CORS ────────────────────────────────────────────────────────────
  app.use(
    cors({
      origin: CORS_ALLOWLIST,
      credentials: true,
    })
  );

  // ── 3-4. Body parsers ──────────────────────────────────────────────────
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // ── 5. Compression ────────────────────────────────────────────────────
  // gzip (and Brotli where the client advertises br) for responses ≥ 10 KB
  // Satisfies Req 10.6: "Compress all API responses exceeding 10 KB"
  app.use(compression({ threshold: 10 * 1024 }));

  // ── 6. General rate limiter ───────────────────────────────────────────
  // OTP-specific limiter (3 req/hour/phone) is applied per-route in the
  // auth module to avoid running it on every request.
  app.use(rateLimiter);

  // ── 7. Routes ─────────────────────────────────────────────────────────
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/auth', authRouter);
  app.use('/onboarding', onboardingRouter);
  app.use('/members/me/consent', consentRouter);

  // ── 8. Global error handler ───────────────────────────────────────────
  // Must be registered after all routes. Express identifies error middleware
  // by its 4-parameter signature (err, req, res, next).
  app.use(errorHandler);

  return app;
}
