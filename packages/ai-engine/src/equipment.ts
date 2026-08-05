import { Exercise } from '@phyziq/shared';

/**
 * Filters a list of exercises returning only those where the required equipment
 * is a subset of the available equipment.
 */
export function filterExercisesByEquipment(
  exercises: Exercise[],
  availableEquipment: string[]
): Exercise[] {
  const availableSet = new Set(availableEquipment);

  return exercises.filter((exercise) => {
    // If an exercise requires no equipment, it's always available
    if (!exercise.equipment_required || exercise.equipment_required.length === 0) {
      return true;
    }

    // Check if every piece of required equipment is in the available set
    return exercise.equipment_required.every((eq) => availableSet.has(eq));
  });
}
