import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { prisma } from '../../lib/db.js';
import { HealthDataRepository } from '../consent/health-data.repository.js';
import { requireAuth } from '../auth/auth.middleware.js';
import { AppError } from '../../lib/app-error.js';

export const onboardingRouter = Router();

export const qrContextSchema = z.object({
  qr_code_token: z.string().min(1),
});

export const registerSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  date_of_birth: z.string().datetime(),
  sex: z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
  height_cm: z.number().min(50).max(300),
  weight_kg: z.number().min(20).max(500),
  fitness_goal: z.string(),
  activity_level: z.string(),
  gym_id: z.string().uuid().nullable().optional(),
});

export const ncdScreeningSchema = z.object({
  diabetes_risk: z.enum(['low', 'moderate', 'high', 'diagnosed']),
  hypertension_risk: z.enum(['low', 'moderate', 'high', 'diagnosed']),
  cardiovascular_risk: z.enum(['low', 'moderate', 'high', 'diagnosed']),
  medications: z.record(z.unknown()).nullable().optional(),
});

onboardingRouter.post(
  '/qr-context',
  validate(qrContextSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { qr_code_token } = req.body;
      const gym = await prisma.gymPartner.findFirst({
        where: { qr_code_token, is_active: true }
      });

      if (!gym) {
        throw new AppError(404, 'NOT_FOUND', 'Invalid or inactive QR code.');
      }

      res.status(200).json({
        success: true,
        data: {
          gym_id: gym.id,
          gym_name: gym.name,
          location: gym.location,
          equipment_list: gym.equipment_list
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

onboardingRouter.post(
  '/register',
  requireAuth,
  validate(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const memberId = req.auth!.sub;
      const data = req.body;

      const member = await prisma.member.update({
        where: { id: memberId },
        data: {
          first_name: data.first_name,
          last_name: data.last_name,
          date_of_birth: new Date(data.date_of_birth),
          sex: data.sex,
          height_cm: data.height_cm,
          weight_kg: data.weight_kg,
          fitness_goal: data.fitness_goal,
          activity_level: data.activity_level,
          gym_id: data.gym_id || null,
        }
      });

      res.status(200).json({ success: true, data: member });
    } catch (error) {
      next(error);
    }
  }
);

onboardingRouter.post(
  '/ncd-screening',
  requireAuth,
  validate(ncdScreeningSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const memberId = req.auth!.sub;
      const data = req.body;

      // 1. Verify health_data consent is granted
      const consent = await prisma.consentRecord.findFirst({
        where: { member_id: memberId, consent_type: 'health_data', granted: true, revoked_at: null }
      });

      if (!consent) {
        throw new AppError(403, 'CONSENT_REQUIRED', 'Health data consent is required for NCD screening.');
      }

      // 2. Write to isolated Health Data Store
      const healthRepo = new HealthDataRepository();
      const profile = await healthRepo.upsertNcdProfile(memberId, {
        diabetes_risk: data.diabetes_risk,
        hypertension_risk: data.hypertension_risk,
        cardiovascular_risk: data.cardiovascular_risk,
        medications: data.medications || null,
        screening_version: 1
      });

      res.status(200).json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  }
);
