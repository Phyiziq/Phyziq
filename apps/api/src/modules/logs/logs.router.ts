import { Router, Request, Response } from 'express';
import { requireAuth } from '../auth/auth.middleware.js';
import { cvJobsQueue, voiceJobsQueue } from '../../workers/ai-queue.js';
import { z } from 'zod';
import { prisma } from '../../lib/db.js';
import { HealthDataRepository } from '../consent/health-data.repository.js';
import { detectNcdConflicts } from '@phyziq/ai-engine';

export const logsRouter = Router();

// In a real implementation, these would upload to S3 directly or generate a presigned URL.
// For the MVP, we assume the client sends a mock URL or the binary data in base64.
// For simplicity in this mock, we accept an image_url and audio_url.

const photoLogSchema = z.object({
  image_url: z.string().url()
});

const voiceLogSchema = z.object({
  audio_url: z.string().url()
});

logsRouter.post('/meal/photo', requireAuth, async (req: Request, res: Response) => {
  try {
    const { image_url } = photoLogSchema.parse(req.body);
    const memberId = req.auth!.sub;

    const job = await cvJobsQueue.add('meal-photo-cv', {
      memberId,
      imageUrl: image_url
    });

    res.status(202).json({
      status: 'accepted',
      job_id: job.id
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

logsRouter.post('/meal/voice', requireAuth, async (req: Request, res: Response) => {
  try {
    const { audio_url } = voiceLogSchema.parse(req.body);
    const memberId = req.auth!.sub;

    const job = await voiceJobsQueue.add('meal-voice-transcription', {
      memberId,
      audioUrl: audio_url
    });

    res.status(202).json({
      status: 'accepted',
      job_id: job.id
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

const workoutLogSchema = z.object({
  session_id: z.string().uuid().optional(),
  exercise_id: z.string().uuid().optional(),
  sets: z.array(z.object({
    reps: z.number(),
    weight_kg: z.number()
  })),
  recovery_score: z.number().min(1).max(10).optional(),
  offline_id: z.string().optional()
});

logsRouter.post('/workout', requireAuth, async (req: Request, res: Response) => {
  try {
    const data = workoutLogSchema.parse(req.body);
    const memberId = req.auth!.sub;

    const log = await prisma.workoutLog.create({
      data: {
        memberId,
        sessionId: data.session_id,
        exerciseId: data.exercise_id,
        sets: data.sets,
        recoveryScore: data.recovery_score,
        synced: true,
        offlineId: data.offline_id
      }
    });

    res.status(201).json({ success: true, data: log });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

const mealLogSchema = z.object({
  meal_type: z.string().optional(),
  food_items: z.array(z.object({
    food_item_id: z.string().uuid(),
    name: z.string(),
    quantity_g: z.number()
  })),
  log_source: z.string().default('manual'),
  photo_url: z.string().optional(),
  offline_id: z.string().optional()
});

logsRouter.post('/meal', requireAuth, async (req: Request, res: Response) => {
  try {
    const data = mealLogSchema.parse(req.body);
    const memberId = req.auth!.sub;

    const log = await prisma.mealLog.create({
      data: {
        memberId,
        mealType: data.meal_type,
        foodItems: data.food_items,
        logSource: data.log_source,
        photoUrl: data.photo_url,
        synced: true,
        offlineId: data.offline_id
      }
    });

    // Detect NCD conflicts
    const ncdProfile = await HealthDataRepository.findNcdProfile(memberId);
    
    // Fetch food items for nutrition data
    const foodItemIds = data.food_items.map(i => i.food_item_id);
    const foods = await prisma.foodItem.findMany({
      where: { id: { in: foodItemIds } },
      select: { id: true, name: true, glycaemicIndex: true, sodiumMg: true }
    });

    const foodDatabase = foods.map(f => ({
      id: f.id,
      name: f.name,
      glycaemic_index: f.glycaemicIndex ? Number(f.glycaemicIndex) : null,
      sodium_mg: f.sodiumMg ? Number(f.sodiumMg) : null
    }));

    const warnings = detectNcdConflicts(log as any, ncdProfile, foodDatabase);

    res.status(201).json({ success: true, data: log, warnings });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

const mealLogCorrectionSchema = z.object({
  food_items: z.array(z.object({
    food_item_id: z.string().uuid(),
    name: z.string(),
    quantity_g: z.number()
  }))
});

logsRouter.patch('/meal/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const data = mealLogCorrectionSchema.parse(req.body);
    const memberId = req.auth!.sub;
    const logId = req.params.id;

    const existingLog = await prisma.mealLog.findUnique({
      where: { id: logId }
    });

    if (!existingLog || existingLog.memberId !== memberId) {
      return res.status(404).json({ error: 'Log not found' });
    }

    const updatedLog = await prisma.mealLog.update({
      where: { id: logId },
      data: {
        corrections: existingLog.foodItems as any,
        foodItems: data.food_items,
        logSource: 'manual_correction'
      }
    });

    res.status(200).json({ success: true, data: updatedLog });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});
