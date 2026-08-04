/**
 * Health DB connection pool — INTERNAL to consent module only.
 *
 * Do NOT import this file from outside `apps/api/src/modules/consent/`.
 * The ESLint `import/no-restricted-paths` rule in `.eslintrc.js` enforces
 * this boundary at lint time.
 *
 * Requirements: 1.7, 11.2
 */

import pg from 'pg';

const { Pool } = pg;

/**
 * A singleton Pool connecting to the Health_Data_Store (HEALTH_DB_URL).
 * This is deliberately separate from the Prisma client that connects to the
 * main database (DATABASE_URL).
 */
let _pool: pg.Pool | null = null;

export function getHealthPool(): pg.Pool {
  if (!_pool) {
    const connectionString = process.env['HEALTH_DB_URL'];
    if (!connectionString) {
      throw new Error(
        'HEALTH_DB_URL environment variable is not set. ' +
          'The Health_Data_Store requires a separate connection string.'
      );
    }

    _pool = new Pool({
      connectionString,
      // Keep the pool small — health DB access is controlled and audited
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });

    _pool.on('error', (err) => {
      // Log pool errors without crashing the process
      console.error('[health-db] Unexpected error on idle pool client', err);
    });
  }

  return _pool;
}

/** Gracefully end the pool (for test teardown or graceful shutdown). */
export async function closeHealthPool(): Promise<void> {
  if (_pool) {
    await _pool.end();
    _pool = null;
  }
}
