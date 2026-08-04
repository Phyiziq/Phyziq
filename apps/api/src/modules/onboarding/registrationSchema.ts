// Feature: phyziq-platform, Property 2: Registration Validation Completeness
// Requirements: 1.2, 1.5

import { z } from 'zod';

const E164_RE = /^\+[1-9]\d{6,14}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Minimum age in years for registration (Req 1.2) */
const MIN_AGE_YEARS = 13;

function isOldEnough(dob: string): boolean {
  const birth = new Date(dob);
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - MIN_AGE_YEARS);
  return birth <= cutoff;
}

export const registrationSchema = z.object({
  phone_number: z.string().regex(E164_RE, 'Phone must be in E.164 format'),
  first_name: z.string().min(1, 'first_name is required'),
  last_name: z.string().min(1, 'last_name is required'),
  date_of_birth: z
    .string()
    .date('date_of_birth must be a valid ISO 8601 date (YYYY-MM-DD)')
    .refine(isOldEnough, `Member must be at least ${MIN_AGE_YEARS} years old`),
  sex: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  height_cm: z.number().min(50).max(300).optional(),
  weight_kg: z.number().min(20).max(500).optional(),
  fitness_goal: z.string().min(1, 'fitness_goal is required'),
  activity_level: z.string().min(1, 'activity_level is required'),
  gym_id: z
    .string()
    .regex(UUID_RE, 'gym_id must be a valid UUID v4')
    .nullable()
    .optional(),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;
