/**
 * validate.ts — Zod validation middleware factories
 *
 * Provides per-route Zod validation for request body, query params, and
 * route params. On validation failure, passes the ZodError to the next
 * error handler, which will convert it to a 422 VALIDATION_ERROR response.
 *
 * Usage:
 *   router.post('/register', validate(registrationSchema), handler);
 *   router.get('/items', validateQuery(querySchema), handler);
 *   router.get('/items/:id', validateParams(paramsSchema), handler);
 */

import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';

/**
 * Validates `req.body` against the provided Zod schema.
 * On success, replaces `req.body` with the parsed (coerced) value.
 * On failure, forwards the ZodError to the global error handler.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (result.success) {
      req.body = result.data;
      next();
    } else {
      next(result.error);
    }
  };
}

/**
 * Validates `req.query` against the provided Zod schema.
 * On success, replaces `req.query` with the parsed value.
 * On failure, forwards the ZodError to the global error handler.
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (result.success) {
      // req.query is typed as ParsedQs; cast via unknown for type safety
      (req as Request & { query: unknown }).query = result.data as Request['query'];
      next();
    } else {
      next(result.error);
    }
  };
}

/**
 * Validates `req.params` against the provided Zod schema.
 * On success, replaces `req.params` with the parsed value.
 * On failure, forwards the ZodError to the global error handler.
 */
export function validateParams(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (result.success) {
      req.params = result.data as Request['params'];
      next();
    } else {
      next(result.error);
    }
  };
}
