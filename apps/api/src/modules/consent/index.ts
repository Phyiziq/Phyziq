/**
 * Consent & Privacy Module — public exports
 *
 * Other modules should import from this barrel file, never from internal
 * files (health-db.ts, etc.) directly. The ESLint boundary rule enforces this.
 *
 * Requirements: 1.7, 11.2, 11.6
 */

export { HealthDataRepository } from './health-data.repository.js';

// Re-export closeHealthPool for graceful shutdown use in the API entry point
export { closeHealthPool } from './health-db.js';
