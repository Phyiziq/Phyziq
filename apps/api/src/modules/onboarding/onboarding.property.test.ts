import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { qrContextSchema, registerSchema } from './onboarding.router.js';

describe('Onboarding Module Properties', () => {
  it('Property 1: QR Code Pre-fill Consistency - schema accepts valid tokens and rejects empties', () => {
    fc.assert(
      fc.property(fc.string(), (token) => {
        const result = qrContextSchema.safeParse({ qr_code_token: token });
        if (token.length >= 1) {
          expect(result.success).toBe(true);
        } else {
          expect(result.success).toBe(false);
        }
      })
    );
  });

  it('Property 2: Registration Validation Completeness - strict boundary checking', () => {
    // Valid attributes
    const validFirstName = fc.string({ minLength: 1 });
    const validLastName = fc.string({ minLength: 1 });
    const validDate = fc.date({ min: new Date('1900-01-01'), max: new Date('2020-01-01') }).map(d => d.toISOString());
    const validSex = fc.constantFrom('male', 'female', 'other', 'prefer_not_to_say');
    const validHeight = fc.integer({ min: 50, max: 300 });
    const validWeight = fc.float({ min: 20, max: 500, noNaN: true });
    const validGoal = fc.string({ minLength: 1 });
    const validLevel = fc.string({ minLength: 1 });
    const validGymId = fc.oneof(fc.constant(null), fc.constant(undefined), fc.uuid());

    const arbValidMember = fc.record({
      first_name: validFirstName,
      last_name: validLastName,
      date_of_birth: validDate,
      sex: validSex,
      height_cm: validHeight,
      weight_kg: validWeight,
      fitness_goal: validGoal,
      activity_level: validLevel,
      gym_id: validGymId
    });

    // Valid payloads should ALWAYS be successful
    fc.assert(
      fc.property(arbValidMember, (member) => {
        const result = registerSchema.safeParse(member);
        expect(result.success).toBe(true);
      })
    );

    // Invalid bounds (e.g. negative height) should ALWAYS fail
    const arbInvalidMember = fc.record({
      first_name: validFirstName,
      last_name: validLastName,
      date_of_birth: validDate,
      sex: validSex,
      height_cm: fc.integer({ min: -100, max: 49 }), // invalid
      weight_kg: validWeight,
      fitness_goal: validGoal,
      activity_level: validLevel,
      gym_id: validGymId
    });

    fc.assert(
      fc.property(arbInvalidMember, (member) => {
        const result = registerSchema.safeParse(member);
        expect(result.success).toBe(false);
      })
    );
  });
});
