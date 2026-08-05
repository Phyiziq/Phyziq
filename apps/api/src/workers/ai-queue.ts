import { Queue } from 'bullmq';
import { redisClient } from '../lib/redis.js';

export const llmJobsQueue = new Queue('llm-jobs', {
  connection: redisClient,
});

export const cvJobsQueue = new Queue('cv-jobs', {
  connection: redisClient,
});

export const voiceJobsQueue = new Queue('voice-jobs', {
  connection: redisClient,
});

export const exportJobsQueue = new Queue('export-jobs', {
  connection: redisClient,
});

export const syncJobsQueue = new Queue('sync-jobs', {
  connection: redisClient,
});

export const reportJobsQueue = new Queue('report-jobs', {
  connection: redisClient,
});
