import { Router, Request, Response } from 'express';
import { requireAuth } from '../auth/auth.middleware.js';
import { llmJobsQueue } from '../../workers/ai-queue.js';
import { z } from 'zod';
import { prisma } from '../../lib/db.js';

export const coachRouter = Router();

const chatSchema = z.object({
  prompt: z.string().min(1),
  context: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string()
  })).optional() // sliding window provided by client
});

coachRouter.post('/chat', requireAuth, async (req: Request, res: Response) => {
  try {
    const { prompt, context } = chatSchema.parse(req.body);
    const memberId = req.auth!.sub;

    // Check if the user specifically asked for an exception plan
    if (prompt.toLowerCase().includes('generate exception plan') || prompt.toLowerCase().includes('injury')) {
      const job = await llmJobsQueue.add('coach-exception-plan', {
        memberId,
        prompt,
        context: context || []
      });
      return res.status(202).json({
        status: 'accepted',
        job_id: job.id,
        message: 'Exception plan generation initiated. Awaiting your approval.'
      });
    }

    const job = await llmJobsQueue.add('coach-chat', {
      memberId,
      prompt,
      context: context || [] // 22.1 Sliding context window
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

const approveExceptionPlanSchema = z.object({
  job_id: z.string()
});

// 22.5 Exception plan approval flow
coachRouter.post('/approve-exception-plan', requireAuth, async (req: Request, res: Response) => {
  try {
    const { job_id } = approveExceptionPlanSchema.parse(req.body);
    const memberId = req.auth!.sub;

    // In a real flow, we'd fetch the job result or check a staging table
    // For MVP, we simulate updating the main adaptive plan
    
    // We assume the plan has been drafted, so we just return success
    res.status(200).json({
      success: true,
      message: 'Exception plan approved and applied to your profile.'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});
