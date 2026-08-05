import { Queue } from 'bullmq';
import { redisClient } from '../lib/redis.js';

export const privacyQueue = new Queue('privacy-queue', {
  connection: redisClient,
});
