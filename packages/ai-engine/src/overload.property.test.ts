import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { computeNextSessionLoad, applyRecoveryReduction, redistributeMissedVolume } from './overload.js';
import { WorkoutLog, PlanSession, WorkoutSessionData } from '@phyziq/shared';

// Feature: phyziq-platform, Property 11: Progressive Overload Safety Bounds
// Feature: phyziq-platform, Property 14: Progressive Overload Target Range
// Feature: phyziq-platform, Property 13: Recovery-Based Intensity Reduction
// Feature: phyziq-platform, Property 12: Volume Conservation on Missed Session

const arbWorkoutLog = fc.record({
  id: fc.uuid(),
  member_id: fc.uuid(),
  session_id: fc.uuid(),
  exercise_id: fc.uuid(),
  logged_at: fc.date().map(d => d.toISOString()),
  sets: fc.array(fc.record({
    set_number: fc.integer({ min: 1, max: 5 }),
    weight_kg: fc.float({ min: 1, max: 200 }).filter(w => w > 0),
    reps: fc.integer({ min: 1, max: 20 }),
    duration_s: fc.constant(null)
  }), { minLength: 1, maxLength: 5 }),
  recovery_score: fc.constant(null),
  synced: fc.boolean(),
  offline_id: fc.constant(null),
}) as fc.Arbitrary<WorkoutLog>;

describe('Progressive Overload Properties', () => {
  it('Property 11: Progressive Overload Safety Bounds - Never exceed 15% jump', () => {
    fc.assert(
      fc.property(
        fc.array(arbWorkoutLog, { minLength: 1, maxLength: 10 }),
        fc.constantFrom<'beginner', 'intermediate', 'advanced'>('beginner', 'intermediate', 'advanced'),
        (logs, level) => {
          const rec = computeNextSessionLoad(logs, level);
          if (rec) {
            // Recompute avg weight of last log to check the bound
            const sortedLogs = [...logs].sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime());
            const lastLog = sortedLogs[sortedLogs.length - 1];
            const avgWeight = lastLog.sets.reduce((sum, set) => sum + set.weight_kg, 0) / lastLog.sets.length;
            
            expect(rec.recommended_weight_kg).toBeLessThanOrEqual(Number((avgWeight * 1.15).toFixed(2)));
          }
        }
      )
    );
  });

  it('Property 14: Progressive Overload Target Range - 5-10% jump on consistent overperformance', () => {
    // Construct a scenario with 3 logs where weight shoots up by >20%
    const baseLog = {
      id: '1', member_id: 'm1', session_id: 's1', exercise_id: 'e1',
      logged_at: new Date('2024-01-01').toISOString(),
      sets: [{ set_number: 1, weight_kg: 100, reps: 10, duration_s: null }],
      recovery_score: null, synced: false, offline_id: null
    };

    const logs = [
      { ...baseLog, logged_at: new Date('2024-01-01').toISOString(), sets: [{ set_number: 1, weight_kg: 100, reps: 10, duration_s: null }] },
      { ...baseLog, logged_at: new Date('2024-01-03').toISOString(), sets: [{ set_number: 1, weight_kg: 110, reps: 10, duration_s: null }] },
      { ...baseLog, logged_at: new Date('2024-01-05').toISOString(), sets: [{ set_number: 1, weight_kg: 125, reps: 10, duration_s: null }] }, // > 20% from first
    ];

    const rec = computeNextSessionLoad(logs, 'intermediate');
    expect(rec).not.toBeNull();
    // 125 * 1.05 = 131.25
    expect(rec!.recommended_weight_kg).toEqual(131.25); 
  });
});

describe('Recovery Reduction Properties', () => {
  it('Property 13: Recovery-Based Intensity Reduction', () => {
    const sessionData: WorkoutSessionData = {
      day: 1, session_type: 'workout',
      exercises: [
        { exercise_id: 'e1', exercise_name: 'Squat', sets: 3, reps: 10, weight_kg: 100, rest_seconds: 60, rationale: null }
      ]
    };

    // Not reduced
    const goodRecovery = applyRecoveryReduction(sessionData, [8, 9]);
    expect(goodRecovery.reduced).toBe(false);
    expect(goodRecovery.session.exercises[0].weight_kg).toEqual(100);

    // Reduced
    const badRecovery = applyRecoveryReduction(sessionData, [4, 4]);
    expect(badRecovery.reduced).toBe(true);
    expect(badRecovery.session.exercises[0].weight_kg).toEqual(85); // 100 * 0.85
  });
});

describe('Volume Redistribution Properties', () => {
  it('Property 12: Volume Conservation on Missed Session', () => {
    const weekSchedule: PlanSession[] = [
      {
        id: 's1', plan_id: 'p1', member_id: 'm1', scheduled_date: '', session_type: 'workout', status: 'missed',
        adaptation_note: null,
        session_data: { day: 1, session_type: 'workout', exercises: [{ exercise_id: 'e1', exercise_name: 'Squat', sets: 3, reps: 10, weight_kg: 100, rest_seconds: 60, rationale: null }] }
      },
      {
        id: 's2', plan_id: 'p1', member_id: 'm1', scheduled_date: '', session_type: 'workout', status: 'scheduled',
        adaptation_note: null,
        session_data: { day: 3, session_type: 'workout', exercises: [{ exercise_id: 'e2', exercise_name: 'Bench', sets: 3, reps: 10, weight_kg: 80, rest_seconds: 60, rationale: null }] }
      }
    ];

    const newSchedule = redistributeMissedVolume(weekSchedule, 's1');
    
    // s2 should now have 2 exercises
    const s2 = newSchedule.find(s => s.id === 's2')!;
    expect(s2.session_data.exercises.length).toEqual(2);
    expect(s2.session_data.exercises[1].exercise_id).toEqual('e1');
    expect(s2.status).toEqual('rebuilt');
  });
});
