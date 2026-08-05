import { Router, Request, Response } from 'express';
import { requireAuth } from '../auth/auth.middleware.js';
import { z } from 'zod';
import { prisma } from '../../lib/db.js';

export const syncRouter = Router();

const pushSchema = z.object({
  logs: z.array(z.object({
    id: z.string(),
    planId: z.string(),
    sessionDate: z.string(),
    logData: z.any()
  }))
});

/**
 * 27.6 Implement sync push endpoint (handles bulk logs from mobile offline worker)
 */
syncRouter.post('/push', requireAuth, async (req: Request, res: Response) => {
  try {
    const data = pushSchema.parse(req.body);
    const memberId = req.auth!.sub;

    let processedCount = 0;
    
    // Server-Wins conflict resolution strategy (as discussed in open questions):
    // If a log already exists for this session date, we skip the offline one.
    // Otherwise, we insert it.
    for (const log of data.logs) {
      const existing = await prisma.workoutLog.findFirst({
        where: {
          planId: log.planId,
          sessionDate: new Date(log.sessionDate)
        }
      });

      if (!existing) {
        await prisma.workoutLog.create({
          data: {
            memberId,
            planId: log.planId,
            sessionDate: new Date(log.sessionDate),
            exercises: log.logData, // Assuming logData matches the schema structure
            moodScore: 3, // Mocking some required fields
            perceivedExertion: 5
          }
        });
        processedCount++;
      }
    }

    res.status(200).json({ success: true, processed: processedCount, message: 'Sync complete' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

/**
 * 27.6 Implement sync pull endpoint and low-bandwidth serving
 */
syncRouter.get('/pull', requireAuth, async (req: Request, res: Response) => {
  try {
    const memberId = req.auth!.sub;
    const since = req.query.since ? new Date(req.query.since as string) : new Date(0);
    const bandwidth = req.query.bandwidth as string; // 'low' or 'high'

    // Fetch plans that were updated since the last sync
    const plans = await prisma.adaptivePlan.findMany({
      where: {
        memberId,
        lastAdaptedAt: { gt: since }
      }
    });

    // 27.6 Low-bandwidth adaptive content serving
    // If bandwidth=low is passed by the mobile app, we strip heavy video URLs
    if (bandwidth === 'low') {
      for (const plan of plans) {
        if (plan.planData && typeof plan.planData === 'object') {
          // Deep clean heavy media urls (mocking the transformation)
          const dataStr = JSON.stringify(plan.planData);
          // Strip anything resembling .mp4 and replace with a standard low-res placeholder image
          const lowResDataStr = dataStr.replace(/https:\/\/[^"]+\.mp4/g, "https://storage.phyziq.com/placeholder-low.jpg");
          plan.planData = JSON.parse(lowResDataStr);
        }
      }
    }

    res.status(200).json({ success: true, data: { plans, timestamp: new Date() } });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
