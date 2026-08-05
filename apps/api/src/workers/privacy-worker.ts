import { Worker, Job } from 'bullmq';
import { redisClient } from '../lib/redis.js';
import { HealthDataRepository } from '../modules/consent/health-data.repository.js';
import { insertComplianceEvent } from '../lib/audit.js';

export const privacyWorker = new Worker(
  'privacy-queue',
  async (job: Job) => {
    if (job.name === 'delete-health-data') {
      const { memberId } = job.data;
      if (!memberId) {
        throw new Error('Missing memberId in job data');
      }

      const repo = new HealthDataRepository();
      
      // Attempt to delete health data
      await repo.deleteAllHealthData(memberId, 'privacy-worker', `Job ID: ${job.id}`);
      
      // Log ODPC compliance event
      await insertComplianceEvent({
        memberId: memberId,
        eventType: 'data_deleted',
        eventData: { 
          reason: 'consent_withdrawn',
          job_id: job.id,
          execution_time: new Date().toISOString()
        }
      });
    }
  },
  {
    connection: redisClient,
    // Add concurrency limit for health database operations
    concurrency: 5
  }
);

privacyWorker.on('failed', (job, err) => {
  console.error(`Privacy Job ${job?.id} failed:`, err);
});
