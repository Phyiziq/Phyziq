/**
 * validate.test.ts
 *
 * Tests for the Zod validation middleware factories.
 */

import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { validate, validateQuery, validateParams } from './validate.js';

// ── Helpers ────────────────────────────────────────────────────────────────

function makeReq(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    query: {},
    params: {},
    ...overrides,
  } as Request;
}

const res = {} as Response;

// ── validate() ────────────────────────────────────────────────────────────

describe('validate(schema)', () => {
  const schema = z.object({
    name: z.string(),
    age: z.number(),
  });

  it('calls next() without error when body is valid', () => {
    const req = makeReq({ body: { name: 'Alice', age: 30 } });
    const next = vi.fn() as NextFunction;

    validate(schema)(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith(); // no args = success
  });

  it('replaces req.body with the parsed/coerced value on success', () => {
    const req = makeReq({ body: { name: 'Bob', age: 25, extra: 'stripped' } });
    const next = vi.fn() as NextFunction;

    validate(schema)(req, res, next);

    // Zod strips unknown keys by default
    expect(req.body).toEqual({ name: 'Bob', age: 25 });
  });

  it('calls next(ZodError) when body is invalid', () => {
    const req = makeReq({ body: { name: 123, age: 'not-a-number' } });
    const next = vi.fn() as NextFunction;

    validate(schema)(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    const arg = (next as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(arg).toBeInstanceOf(ZodError);
  });

  it('calls next(ZodError) when required fields are missing', () => {
    const req = makeReq({ body: {} });
    const next = vi.fn() as NextFunction;

    validate(schema)(req, res, next);

    const arg = (next as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(arg).toBeInstanceOf(ZodError);
  });
});

// ── validateQuery() ───────────────────────────────────────────────────────

describe('validateQuery(schema)', () => {
  const schema = z.object({
    page: z.string().regex(/^\d+$/),
  });

  it('calls next() on valid query', () => {
    const req = makeReq({ query: { page: '2' } as unknown as Request['query'] });
    const next = vi.fn() as NextFunction;

    validateQuery(schema)(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('calls next(ZodError) on invalid query', () => {
    const req = makeReq({ query: { page: 'abc' } as unknown as Request['query'] });
    const next = vi.fn() as NextFunction;

    validateQuery(schema)(req, res, next);

    const arg = (next as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(arg).toBeInstanceOf(ZodError);
  });
});

// ── validateParams() ──────────────────────────────────────────────────────

describe('validateParams(schema)', () => {
  const schema = z.object({
    id: z.string().uuid(),
  });

  it('calls next() on valid params', () => {
    const req = makeReq({
      params: { id: '550e8400-e29b-41d4-a716-446655440000' },
    });
    const next = vi.fn() as NextFunction;

    validateParams(schema)(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('calls next(ZodError) on invalid params', () => {
    const req = makeReq({ params: { id: 'not-a-uuid' } });
    const next = vi.fn() as NextFunction;

    validateParams(schema)(req, res, next);

    const arg = (next as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(arg).toBeInstanceOf(ZodError);
  });
});
