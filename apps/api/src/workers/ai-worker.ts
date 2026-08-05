import { Worker, Job } from 'bullmq';
import { redisClient } from '../lib/redis.js';
import { broadcastEvent } from '../modules/notifications/sse.router.js';

export const llmWorker = new Worker('llm-jobs', async (job: Job) => {
  const { memberId, prompt } = job.data;
  
  // Graceful degradation: simulate a timeout if queue depth was somehow massive, 
  // or explicitly test timeouts by passing 'TRIGGER_TIMEOUT' in the prompt.
  if (prompt === 'TRIGGER_TIMEOUT') {
    await new Promise((resolve) => setTimeout(resolve, 31000));
  } else {
    // Simulate API processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // If elapsed time > 30s, we return AI_JOB_TIMEOUT
  if (prompt === 'TRIGGER_TIMEOUT') {
    const result = {
      status: 'error',
      code: 'AI_JOB_TIMEOUT',
      confidence: 0,
    };
    broadcastEvent(memberId, { type: 'llm_job_complete', jobId: job.id, result });
    return result;
  }

  const result = {
    status: 'success',
    response: {
      message: 'This is a mocked Claude 3.5 Sonnet response.',
      confidence: 95
    }
  };

  broadcastEvent(memberId, { type: 'llm_job_complete', jobId: job.id, result });
  return result;
}, { connection: redisClient });

export const cvWorker = new Worker('cv-jobs', async (job: Job) => {
  const { memberId, imageUrl } = job.data;

  // Simulate Google Vision API processing delay
  await new Promise((resolve) => setTimeout(resolve, 3000));

  const result = {
    status: 'success',
    meal_log_draft: {
      food_items: [
        { food_item_id: 'mock-id-1', name: 'Grilled Chicken Breast', quantity_g: 200, confidence: 92 },
        { food_item_id: 'mock-id-2', name: 'Broccoli', quantity_g: 150, confidence: 88 }
      ]
    }
  };

  broadcastEvent(memberId, { type: 'cv_job_complete', jobId: job.id, result });
  return result;
}, { connection: redisClient });

export const voiceWorker = new Worker('voice-jobs', async (job: Job) => {
  const { memberId, audioUrl } = job.data;

  // Simulate Whisper API processing delay
  await new Promise((resolve) => setTimeout(resolve, 3000));

  const result = {
    status: 'success',
    meal_log_draft: {
      food_items: [
        { food_item_id: 'mock-id-3', name: 'Oatmeal', quantity_g: 100, confidence: 95 },
        { food_item_id: 'mock-id-4', name: 'Banana', quantity_g: 120, confidence: 98 }
      ]
    }
  };

  broadcastEvent(memberId, { type: 'voice_job_complete', jobId: job.id, result });
  return result;
}, { connection: redisClient });

// Handle worker errors
const handleWorkerError = (err: Error) => {
  console.error('AI Worker Error:', err);
};

llmWorker.on('error', handleWorkerError);
cvWorker.on('error', handleWorkerError);
voiceWorker.on('error', handleWorkerError);
