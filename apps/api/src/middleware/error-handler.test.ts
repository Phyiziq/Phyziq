/**
 * error-handler.test.ts
 *
 * Tests for the global Express error handler.
 * Validates the ApiError envelope shape for each error category.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { ZodError, z } from 'zod';
import { errorHandler } from './error-handler.js';
import { AppError } from '../lib/app-error.js';

// ── Helpers ────────────────────────────────────────────────────────────────

function makeMocks() {
  const req = {} as Request;
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const res = { status, json } as unknown as Response;
  // Wire res.status(...).json and res.json to the same capture
  status.mockImplementation(() => ({ json }));
  const next = vi.fn() as NextFunction;
  return { req, res, status, json, next };
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe('errorHandler', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'test');
  });

  it('maps ZodError to 422 with VALIDATION_ERROR code', () => {
    const schema = z.object({ name: z.string() });
    const result = schema.safeParse({ name: 123 });
    expect(result.success).toBe(false);

    const zodError = (result as { error: ZodError }).error;
    const { req, res, status, json } = makeMocks();

    errorHandler(zodError, req, res, vi.fn() as NextFunction);

    expect(status).toHaveBeenCalledWith(422);
    const body = json.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(body['success']).toBe(false);
    expect((body['error'] as Record<string, unknown>)['code']).toBe('VALIDATION_ERROR');
    expect((body['error'] as Record<string, unknown>)['details']).toBeDefined();
  });

  it('maps AppError to its statusCode and code', () => {
    const err = new AppError(404, 'NOT_FOUND', 'Resource not found');
    const { req, res, status, json } = makeMocks();

    errorHandler(err, req, res, vi.fn() as NextFunction);

    expect(status).toHaveBeenCalledWith(404);
    const body = json.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(body['success']).toBe(false);
    expect((body['error'] as Record<string, unknown>)['code']).toBe('NOT_FOUND');
    expect((body['error'] as Record<string, unknown>)['message']).toBe('Resource not found');
  });

  it('maps AppError with details to include details in response', () => {
    const err = new AppError(400, 'BAD_REQUEST', 'Bad input', { field: 'email' });
    const { req, res, status, json } = makeMocks();

    errorHandler(err, req, res, vi.fn() as NextFunction);

    expect(status).toHaveBeenCalledWith(400);
    const body = json.mock.calls[0]?.[0] as Record<string, unknown>;
    expect((body['error'] as Record<string, unknown>)['details']).toEqual({ field: 'email' });
  });

  it('maps unknown error to 500 with INTERNAL_ERROR code', () => {
    const err = new Error('Something exploded');
    const { req, res, status, json } = makeMocks();

    errorHandler(err, req, res, vi.fn() as NextFunction);

    expect(status).toHaveBeenCalledWith(500);
    const body = json.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(body['success']).toBe(false);
    expect((body['error'] as Record<string, unknown>)['code']).toBe('INTERNAL_ERROR');
    expect((body['error'] as Record<string, unknown>)['message']).toBe(
      'An unexpected error occurred'
    );
  });

  it('maps unknown non-Error object to 500 with INTERNAL_ERROR code', () => {
    const err = { weird: 'object' };
    const { req, res, status, json } = makeMocks();

    errorHandler(err, req, res, vi.fn() as NextFunction);

    expect(status).toHaveBeenCalledWith(500);
    const body = json.mock.calls[0]?.[0] as Record<string, unknown>;
    expect((body['error'] as Record<string, unknown>)['code']).toBe('INTERNAL_ERROR');
  });

  it('includes stack trace in non-production environments', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const err = new AppError(500, 'OOPS', 'dev error');
    const { req, res, json } = makeMocks();

    errorHandler(err, req, res, vi.fn() as NextFunction);

    const body = json.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(body['stack']).toBeDefined();
  });

  it('omits stack trace in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const err = new AppError(500, 'OOPS', 'prod error');
    const { req, res, json } = makeMocks();

    errorHandler(err, req, res, vi.fn() as NextFunction);

    const body = json.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(body['stack']).toBeUndefined();
  });
});
