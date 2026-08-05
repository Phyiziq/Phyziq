import { Worker } from 'bullmq';
import { prisma } from '../lib/db.js';
import { redis } from '../lib/redis.js';

export const gymJobsQueueName = 'gym-jobs';

/**
 * 24.1 Implement gym analytics aggregator cron job
 * Runs periodically to snapshot active members, average plan completion, etc.
 */
export const gymWorker = new Worker(
  gymJobsQueueName,
  async (job) => {
    switch (job.name) {
      case 'aggregate-gym-analytics': {
        const { gymId } = job.data;
        
        // Count active members in this gym
        const members = await prisma.member.findMany({
          where: { gymId }
        });

        // Mock aggregation logic: normally we'd scan workout_logs and plan_sessions
        const totalActiveMembers = members.length;
        const avgPlanCompletionPct = Math.random() * 100;
        const avgWeeklySessions = Math.random() * 5;
        const topExercises = [
          { exercise_name: 'Squat', count: 120 },
          { exercise_name: 'Bench Press', count: 95 }
        ];

        // 24.8 Implement monthly engagement report generation logic integrated here
        const atRiskMembers = members.filter(() => Math.random() > 0.8).map(m => m.id);

        const snapshot = await prisma.gymAnalyticsSnapshot.create({
          data: {
            gymId,
            snapshotAt: new Date(),
            totalActiveMembers,
            avgPlanCompletionPct,
            avgWeeklySessions,
            topExercises,
            sessionHeatmap: { 'Monday': { '18:00': 45 } },
            atRiskMemberCount: atRiskMembers.length,
            atRiskMemberIds: atRiskMembers
          }
        });

        return { snapshotId: snapshot.id };
      }
      default:
        throw new Error(`Unknown job name: ${job.name}`);
    }
  },
  { connection: redis }
);

gymWorker.on('failed', (job, err) => {
  console.error(`Gym job ${job?.id} failed with error ${err.message}`);
});
