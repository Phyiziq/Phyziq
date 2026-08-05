import { Router, Request, Response } from 'express';
import { requireAuth } from '../auth/auth.middleware.js';
import { z } from 'zod';
import { prisma } from '../../lib/db.js';
import { exportJobsQueue } from '../../workers/export-queue.js'; // We'll create this queue

export const exportsRouter = Router();

const requestExportSchema = z.object({
  plan_id: z.string().uuid(),
  format: z.enum(['pdf', 'docx'])
});

/**
 * 26.1 & 26.2 Request export generation
 */
exportsRouter.post('/request', requireAuth, async (req: Request, res: Response) => {
  try {
    const data = requestExportSchema.parse(req.body);
    const memberId = req.auth!.sub;

    const plan = await prisma.adaptivePlan.findUnique({
      where: { id: data.plan_id }
    });

    if (!plan || plan.memberId !== memberId) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Add job to export queue
    const jobName = data.format === 'pdf' ? 'pdf-export-job' : 'docx-export-job';
    const job = await exportJobsQueue.add(jobName, {
      memberId,
      planId: plan.id,
      format: data.format,
      version: plan.version
    });

    // In a real system, we might track the export status in a PlanExport table.
    // For MVP, we return the job ID for the client to poll or await a websocket event.
    res.status(202).json({
      status: 'accepted',
      job_id: job.id,
      message: `${data.format.toUpperCase()} export requested. Processing in background.`
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

/**
 * 26.4 Implement export download endpoint with pre-signed URL mock
 */
exportsRouter.get('/:id/download', requireAuth, async (req: Request, res: Response) => {
  try {
    const jobId = req.params.id;
    // We would check if the job is completed and fetch the generated S3 URL.
    // Mock implementation returns a dummy pre-signed URL.
    
    // Assume success for MVP demonstration
    res.status(200).json({
      success: true,
      data: {
        download_url: `https://storage.phyziq.com/exports/${jobId}/plan.pdf?token=mock_presigned_token`,
        expires_in: 3600
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
