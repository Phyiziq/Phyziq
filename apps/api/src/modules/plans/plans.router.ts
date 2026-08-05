import { Router, Request, Response } from 'express';
import { requireAuth } from '../auth/auth.middleware.js';
import { z } from 'zod';
import { prisma } from '../../lib/db.js';
import { HealthDataRepository } from '../consent/health-data.repository.js';
import { applyNcdSubstitutions, filterExercisesByEquipment, computeNextSessionLoad } from '@phyziq/ai-engine';
import { llmJobsQueue } from '../../workers/ai-queue.js';
import { AppError } from '../../lib/app-error.js';

export const plansRouter = Router();

plansRouter.get('/preview-plan', requireAuth, async (req: Request, res: Response) => {
  try {
    const memberId = req.auth!.sub;
    
    // Find the active free preview plan
    const plan = await prisma.adaptivePlan.findFirst({
      where: { memberId, status: 'active', isPaid: false },
      orderBy: { generatedAt: 'desc' }
    });

    if (!plan) {
      return res.status(404).json({ error: 'No preview plan found' });
    }

    // Inject NCD Medical Disclaimer if needed
    const ncdProfile = await HealthDataRepository.findNcdProfile(memberId);
    let disclaimer = null;
    if (
      ncdProfile &&
      (
        (ncdProfile.diabetes_risk && ncdProfile.diabetes_risk !== 'low') ||
        (ncdProfile.hypertension_risk && ncdProfile.hypertension_risk !== 'low') ||
        (ncdProfile.cardiovascular_risk && ncdProfile.cardiovascular_risk !== 'low')
      )
    ) {
      disclaimer = "DISCLAIMER: This nutritional guidance is algorithmically generated. Please consult your physician.";
    }

    res.status(200).json({ 
      success: true, 
      data: plan,
      ...(disclaimer ? { disclaimer } : {})
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const generatePlanSchema = z.object({
  equipment_list: z.array(z.string()).default([])
});

plansRouter.post('/generate', requireAuth, async (req: Request, res: Response) => {
  try {
    const data = generatePlanSchema.parse(req.body);
    const memberId = req.auth!.sub;

    const member = await prisma.member.findUnique({ where: { id: memberId } });
    if (!member) throw new AppError(404, 'NOT_FOUND', 'Member not found');

    // NCD Profile
    const ncdProfile = await HealthDataRepository.findNcdProfile(memberId);

    // AI logic orchestration (mocked/abbreviated for MVP endpoint)
    // 1. Fetch NCD substitutions
    // 2. Fetch exercises and filter by equipment
    // 3. Compute progressive overload seeds

    // Enqueue LLM job for narrative
    const job = await llmJobsQueue.add('generate-plan-narrative', {
      memberId,
      prompt: 'Generate an initial 7-day plan narrative for fitness goal: ' + member.fitnessGoal
    });

    // Create draft plan record
    const plan = await prisma.adaptivePlan.create({
      data: {
        memberId,
        planType: 'combined',
        status: 'active',
        isPaid: false,
        weekNumber: 1,
        planData: {
          narrative_job_id: job.id,
          state: 'generating'
        }
      }
    });

    res.status(202).json({ success: true, data: { plan_id: plan.id, job_id: job.id } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

const adaptPlanSchema = z.object({
  plan_id: z.string().uuid(),
  trigger_reason: z.string()
});

plansRouter.post('/adapt', requireAuth, async (req: Request, res: Response) => {
  try {
    const data = adaptPlanSchema.parse(req.body);
    const memberId = req.auth!.sub;

    const plan = await prisma.adaptivePlan.findUnique({ where: { id: data.plan_id } });
    if (!plan || plan.memberId !== memberId) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Increment version and mark last_adapted_at
    const updatedPlan = await prisma.adaptivePlan.update({
      where: { id: plan.id },
      data: {
        version: { increment: 1 },
        lastAdaptedAt: new Date(),
        planData: { ...(plan.planData as object), adaptation_reason: data.trigger_reason }
      }
    });

    // Invalidate exports
    await prisma.planExport.updateMany({
      where: { planId: plan.id },
      data: { isValid: false }
    });

    res.status(200).json({ success: true, data: updatedPlan });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

const swapExerciseSchema = z.object({
  exercise_id: z.string().uuid()
});

plansRouter.post('/swap-exercise', requireAuth, async (req: Request, res: Response) => {
  try {
    const data = swapExerciseSchema.parse(req.body);
    const memberId = req.auth!.sub;

    // Get original exercise
    const original = await prisma.exercise.findUnique({ where: { id: data.exercise_id } });
    if (!original) return res.status(404).json({ error: 'Exercise not found' });

    // Mock pgvector swap: since Prisma Unsupported type requires raw SQL, we do a raw query
    // If no embeddings exist, this will return empty or throw if not handled.
    // For MVP, we simulate a raw SQL query.
    let alternative: any = null;
    try {
      const results: any[] = await prisma.$queryRaw`
        SELECT id, name, movement_pattern
        FROM exercises
        WHERE id != ${original.id}::uuid
        ORDER BY embedding <-> (SELECT embedding FROM exercises WHERE id = ${original.id}::uuid)
        LIMIT 1;
      `;
      if (results && results.length > 0) {
        alternative = results[0];
      }
    } catch (e) {
      console.warn('pgvector search failed or missing embeddings, falling back to basic matching');
      alternative = await prisma.exercise.findFirst({
        where: { id: { not: original.id }, movementPattern: original.movementPattern }
      });
    }

    if (!alternative) {
      return res.status(404).json({ error: 'No alternative exercise found' });
    }

    // Enqueue LLM job for rationale
    const job = await llmJobsQueue.add('swap-rationale', {
      memberId,
      prompt: `Provide one sentence rationale for swapping ${original.name} to ${alternative.name}`
    });

    res.status(200).json({
      success: true,
      data: {
        swapped_to: alternative,
        rationale_job_id: job.id
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});
