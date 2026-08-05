import { Queue } from 'bullmq';
import { redis } from '../lib/redis.js';

export const exportJobsQueueName = 'export-jobs';

// Initialize the queue to send jobs to the export worker
export const exportJobsQueue = new Queue(exportJobsQueueName, {
  connection: redis
});
