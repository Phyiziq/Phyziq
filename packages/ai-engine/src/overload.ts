import { WorkoutLog, PlanSession, ProgressiveOverloadRecommendation, computeConfidenceTier, WorkoutSessionData } from '@phyziq/shared';

export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';

/**
 * Computes the recommended load for the next session using linear periodisation.
 * Applies a safety bound: max single-step increase is 15%.
 */
export function computeNextSessionLoad(
  exerciseLogs: WorkoutLog[],
  fitnessLevel: FitnessLevel
): ProgressiveOverloadRecommendation | null {
  if (exerciseLogs.length === 0) return null;

  // Sort logs by date ascending
  const sortedLogs = [...exerciseLogs].sort(
    (a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime()
  );

  const lastLog = sortedLogs[sortedLogs.length - 1];
  if (!lastLog || lastLog.sets.length === 0 || !lastLog.exercise_id) return null;

  // Calculate average weight used in the last session
  const avgWeight = lastLog.sets.reduce((sum, set) => sum + set.weight_kg, 0) / lastLog.sets.length;
  if (avgWeight <= 0) return null;

  // Check for 3 consecutive sessions of overperformance (>20% over some baseline)
  // For simplicity, we just look at the last 3 logs and see if weight increased sharply.
  // Real implementation would compare against previous targets.
  let isConsistentlyOverperforming = false;
  if (sortedLogs.length >= 3) {
    const lastThree = sortedLogs.slice(-3);
    const w1 = lastThree[0].sets[0]?.weight_kg || 0;
    const w3 = lastThree[2].sets[0]?.weight_kg || 0;
    if (w1 > 0 && w3 > w1 * 1.2) {
      isConsistentlyOverperforming = true;
    }
  }

  let targetWeight = avgWeight;

  if (isConsistentlyOverperforming) {
    targetWeight = avgWeight * 1.05; // 5% increase instead of normal progression
  } else {
    // Normal progression based on fitness level
    const progressionFactor = fitnessLevel === 'beginner' ? 1.05 : fitnessLevel === 'intermediate' ? 1.025 : 1.01;
    targetWeight = avgWeight * progressionFactor;
  }

  // Safety bound: max 15% increase
  if (targetWeight > avgWeight * 1.15) {
    targetWeight = avgWeight * 1.15;
  }

  const confidenceValue = isConsistentlyOverperforming ? 70 : 90;

  return {
    exercise_id: lastLog.exercise_id,
    recommended_weight_kg: Number(targetWeight.toFixed(2)),
    recommended_reps: lastLog.sets[0].reps, // Keep reps same for linear periodisation here
    recommended_sets: lastLog.sets.length,
    confidence: {
      value: confidenceValue,
      source: 'ai',
      tier: computeConfidenceTier(confidenceValue),
    },
  };
}

/**
 * Reduces intensity of a session if recovery scores are low.
 * Triggered if two consecutive scores < 5.
 */
export function applyRecoveryReduction(
  sessionData: WorkoutSessionData,
  recentRecoveryScores: number[]
): { session: WorkoutSessionData; reduced: boolean } {
  // Check if last two scores are < 5
  if (
    recentRecoveryScores.length >= 2 &&
    recentRecoveryScores[recentRecoveryScores.length - 1] < 5 &&
    recentRecoveryScores[recentRecoveryScores.length - 2] < 5
  ) {
    // Deep clone
    const newSession: WorkoutSessionData = JSON.parse(JSON.stringify(sessionData));

    for (const exercise of newSession.exercises) {
      if (exercise.weight_kg) {
        exercise.weight_kg = Number((exercise.weight_kg * 0.85).toFixed(2)); // Max 85% intensity
        exercise.rationale = 'Reduced intensity due to low recovery scores.';
      }
    }
    return { session: newSession, reduced: true };
  }

  return { session: sessionData, reduced: false };
}

/**
 * Redistributes missed volume across remaining sessions in the week.
 */
export function redistributeMissedVolume(
  weekSchedule: PlanSession[],
  missedSessionId: string
): PlanSession[] {
  const missedSession = weekSchedule.find((s) => s.id === missedSessionId);
  if (!missedSession || missedSession.status !== 'missed') {
    return weekSchedule;
  }

  // Find remaining scheduled sessions
  const remainingSessions = weekSchedule.filter(
    (s) => s.status === 'scheduled' && s.session_type === 'workout' && s.id !== missedSessionId
  );

  if (remainingSessions.length === 0) {
    return weekSchedule; // Cannot redistribute
  }

  const newSchedule: PlanSession[] = JSON.parse(JSON.stringify(weekSchedule));

  // Identify exercises from the missed session
  const missedExercises = missedSession.session_data.exercises;

  // Distribute one missed exercise to each remaining session (simple strategy)
  let currentSessionIndex = 0;
  for (const missedEx of missedExercises) {
    const targetSessionId = remainingSessions[currentSessionIndex].id;
    const targetSession = newSchedule.find((s) => s.id === targetSessionId);

    if (targetSession) {
      // Add the exercise with slightly reduced volume (e.g., 2 sets instead of 3) to not overload the session
      const adaptedEx = { ...missedEx, sets: Math.max(1, missedEx.sets - 1), rationale: 'Recovered from missed session' };
      targetSession.session_data.exercises.push(adaptedEx);
      targetSession.status = 'rebuilt';
      targetSession.adaptation_note = 'Volume redistributed from missed session.';
    }

    currentSessionIndex = (currentSessionIndex + 1) % remainingSessions.length;
  }

  return newSchedule;
}
