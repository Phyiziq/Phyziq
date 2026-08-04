/**
 * AppError — typed application error class
 *
 * Used throughout the API to throw domain errors with a known HTTP status code
 * and error code. The global error handler in middleware/error-handler.ts
 * detects this class via the `.statusCode` property and maps it to the
 * correct HTTP response.
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    // Restore the prototype chain (required when extending Error in TS)
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
