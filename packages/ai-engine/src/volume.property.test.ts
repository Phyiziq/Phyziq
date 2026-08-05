import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { redistributeMissedVolume } from './overload.js';
import { PlanSession } from '@phyziq/shared';

// Feature: phyziq-platform, Property 17: Weekly Volume Consistency Invariant

const arbSession = fc.record({
  id: fc.uuid(),
  plan_id: fc.uuid(),
  member_id: fc.uuid(),
  scheduled_date: fc.date().map(d => d.toISOString()),
  session_type: fc.constant('workout'),
  status: fc.constantFrom('scheduled', 'missed', 'completed', 'rebuilt'),
  adaptation_note: fc.constant(null),
  session_data: fc.record({
    day: fc.integer({ min: 1, max: 7 }),
    session_type: fc.constant('workout'),
    exercises: fc.array(fc.record({
      exercise_id: fc.uuid(),
      exercise_name: fc.string(),
      sets: fc.integer({ min: 1, max: 5 }),
      reps: fc.integer({ min: 1, max: 20 }),
      weight_kg: fc.float({ min: 10, max: 200 }),
      rest_seconds: fc.integer({ min: 30, max: 180 }),
      rationale: fc.constant(null)
    }), { maxLength: 5 })
  })
}) as fc.Arbitrary<PlanSession>;

describe('Volume Consistency Properties', () => {
  it('Property 17: Weekly Volume Consistency Invariant - Redistribution must not increase total weekly volume', () => {
    fc.assert(
      fc.property(
        fc.array(arbSession, { minLength: 2, maxLength: 7 }),
        (weekSchedule) => {
          // Force one session to be missed and one to be scheduled
          weekSchedule[0].status = 'missed';
          weekSchedule[1].status = 'scheduled';

          const missedSessionId = weekSchedule[0].id;

          const totalSetsBefore = weekSchedule.reduce((sum, session) => {
            return sum + session.session_data.exercises.reduce((exSum, ex) => exSum + ex.sets, 0);
          }, 0);

          const newSchedule = redistributeMissedVolume(weekSchedule, missedSessionId);

          const totalSetsAfterActive = newSchedule.reduce((sum, session) => {
            if (session.status === 'missed') return sum;
            return sum + session.session_data.exercises.reduce((exSum, ex) => exSum + ex.sets, 0);
          }, 0);

          // The active sets after redistribution should be less than or equal to the total sets scheduled originally
          expect(totalSetsAfterActive).toBeLessThanOrEqual(totalSetsBefore);
        }
      ),
      { numRuns: 100 }
    );
  });
});
