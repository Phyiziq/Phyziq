import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { filterExercisesByEquipment } from './equipment.js';
import { Exercise } from '@phyziq/shared';

// Feature: phyziq-platform, Property 16: Equipment Constraint Respect

const arbExercise = fc.record({
  id: fc.uuid(),
  name: fc.string(),
  muscle_groups: fc.array(fc.string()),
  equipment_required: fc.array(fc.string()),
  movement_pattern: fc.constant(null)
}) as fc.Arbitrary<Exercise>;

describe('Equipment Constraint Properties', () => {
  it('Property 16: Equipment Constraint Respect - filtered exercises must only use available equipment', () => {
    fc.assert(
      fc.property(
        fc.array(arbExercise, { maxLength: 50 }),
        fc.array(fc.string(), { maxLength: 10 }),
        (exercises, availableEquipment) => {
          const filtered = filterExercisesByEquipment(exercises, availableEquipment);
          
          const availableSet = new Set(availableEquipment);

          for (const ex of filtered) {
            if (ex.equipment_required && ex.equipment_required.length > 0) {
              const allReqAvailable = ex.equipment_required.every(eq => availableSet.has(eq));
              expect(allReqAvailable).toBe(true);
            }
          }
        }
      )
    );
  });
});
