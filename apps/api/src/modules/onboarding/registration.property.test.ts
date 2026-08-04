// Feature: phyziq-platform, Property 2: Registration Validation Completeness
// Requirements: 1.2, 1.5
// numRuns: 100

import * as fc from 'fast-check';
import { describe, it } from 'vitest';
import { registrationSchema } from './registrationSchema';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format a Date as YYYY-MM-DD */
function formatDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Earliest valid DOB: 1940-01-01 */
const DOB_MIN_MS = Date.UTC(1940, 0, 1);

/** Latest valid DOB: exactly 13 years before today */
function dobMaxMs(): number {
  const cutoff = new Date();
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 13);
  return cutoff.getTime();
}

/** Arbitrary that produces a valid YYYY-MM-DD date of birth */
const validDobArb = fc
  .integer({ min: DOB_MIN_MS, max: dobMaxMs() })
  .map((ms) => formatDate(new Date(ms)));

/** Arbitrary for a fully valid registration record */
const validRecordArb = fc.record({
  phone_number: fc.stringMatching(/^\+[1-9]\d{6,14}$/),
  first_name: fc.string({ minLength: 1, maxLength: 50 }),
  last_name: fc.string({ minLength: 1, maxLength: 50 }),
  date_of_birth: validDobArb,
  sex: fc.constantFrom('male' as const, 'female' as const, 'other' as const, 'prefer_not_to_say' as const),
  height_cm: fc.float({ min: 50, max: 300, noNaN: true }),
  weight_kg: fc.float({ min: 20, max: 500, noNaN: true }),
  fitness_goal: fc.string({ minLength: 1, maxLength: 100 }),
  activity_level: fc.string({ minLength: 1, maxLength: 50 }),
  gym_id: fc.uuid({ version: 4 }),
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Property 2: Registration Validation Completeness', () => {
  /**
   * **Validates: Requirements 1.2, 1.5**
   * Test 1 — valid inputs always parse
   */
  it('accepts any fully valid registration input', () => {
    fc.assert(
      fc.property(validRecordArb, (input) => {
        const result = registrationSchema.safeParse(input);
        return result.success === true;
      }),
      { numRuns: 100 },
    );
  });

  /**
   * **Validates: Requirements 1.2, 1.5**
   * Test 2 — invalid phone always rejected
   */
  it('rejects any phone_number that does not match E.164 format', () => {
    const invalidPhoneArb = fc
      .string()
      .filter((s) => !/^\+[1-9]\d{6,14}$/.test(s));

    fc.assert(
      fc.property(validRecordArb, invalidPhoneArb, (base, badPhone) => {
        const input = { ...base, phone_number: badPhone };
        const result = registrationSchema.safeParse(input);
        return result.success === false;
      }),
      { numRuns: 100 },
    );
  });

  /**
   * **Validates: Requirements 1.2, 1.5**
   * Test 3 — physiological bounds violations always rejected
   */
  it('rejects height_cm or weight_kg values outside valid physiological ranges', () => {
    // fc.float requires 32-bit float boundaries — use Math.fround to ensure validity
    const outOfRangeMutationArb = fc.oneof(
      // height below 50 (max is the largest 32-bit float strictly below 50)
      fc.float({ min: Math.fround(-1000), max: Math.fround(49.875), noNaN: true }).map((v) => ({ field: 'height_cm' as const, value: v })),
      // height above 300
      fc.float({ min: Math.fround(300.125), max: Math.fround(10000), noNaN: true }).map((v) => ({ field: 'height_cm' as const, value: v })),
      // weight below 20 (max is the largest 32-bit float strictly below 20)
      fc.float({ min: Math.fround(-1000), max: Math.fround(19.875), noNaN: true }).map((v) => ({ field: 'weight_kg' as const, value: v })),
      // weight above 500
      fc.float({ min: Math.fround(500.125), max: Math.fround(10000), noNaN: true }).map((v) => ({ field: 'weight_kg' as const, value: v })),
    );

    fc.assert(
      fc.property(validRecordArb, outOfRangeMutationArb, (base, mutation) => {
        const input = { ...base, [mutation.field]: mutation.value };
        const result = registrationSchema.safeParse(input);
        return result.success === false;
      }),
      { numRuns: 100 },
    );
  });

  /**
   * **Validates: Requirements 1.2, 1.5**
   * Test 4 — empty required string fields always rejected
   */
  it('rejects any required string field set to an empty string', () => {
    const requiredFieldArb = fc.constantFrom(
      'first_name' as const,
      'last_name' as const,
      'fitness_goal' as const,
      'activity_level' as const,
    );

    fc.assert(
      fc.property(validRecordArb, requiredFieldArb, (base, field) => {
        const input = { ...base, [field]: '' };
        const result = registrationSchema.safeParse(input);
        return result.success === false;
      }),
      { numRuns: 100 },
    );
  });
});
