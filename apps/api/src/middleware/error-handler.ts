/**
 * error-handler.ts — Global Express error handler
 *
 * Formats all errors into the ApiError envelope defined in @phyziq/shared.
 * Must be registered as the LAST middleware in the Express app.
 *
 * Handles:
 *   - ZodError          → 422 VALIDATION_ERROR
 *   - AppError          → uses statusCode from the error instance
 *   - Unknown errors    → 500 INTERNAL_ERROR
 */

import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import type { ApiError } from '@phyziq/shared';
import { AppError } from '../lib/app-error.js';

// The error response body is an ApiError (which already has success: false)
type ErrorResponseBody = ApiError;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response<ErrorResponseBody>,
  _next: NextFunction
): void {
  const isDev = process.env['NODE_ENV'] !== 'production';

  if (err instanceof ZodError) {
    const body: ErrorResponseBody & { stack?: string } = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed.',
        details: err.flatten(),
      },
    };
    if (isDev) body.stack = err.stack;
    res.status(422).json(body);
    return;
  }

  if (err instanceof AppError) {
    const body: ErrorResponseBody & { stack?: string } = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
    };
    if (isDev) body.stack = err.stack;
    res.status(err.statusCode).json(body);
    return;
  }

  // Unknown / unexpected errors
  console.error('[ErrorHandler] Unhandled error:', err);

  const body: ErrorResponseBody & { stack?: string } = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  };

  if (isDev && err instanceof Error) {
    body.stack = err.stack;
  }

  res.status(500).json(body);
}
