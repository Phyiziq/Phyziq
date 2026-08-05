import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { prisma } from '../../lib/db.js';
import { requireAuth } from '../auth/auth.middleware.js';

export const consentRouter = Router();

const setConsentSchema = z.object({
  consent_type: z.enum(['general', 'health_data', 'ai_training']),
  granted: z.boolean(),
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
});

consentRouter.post(
  '/',
  requireAuth,
  validate(setConsentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const memberId = req.auth!.sub;
      const data = req.body;

      const record = await prisma.consentRecord.create({
        data: {
          member_id: memberId,
          consent_type: data.consent_type,
          granted: data.granted,
          ip_address: req.ip || data.ip_address || 'unknown',
          user_agent: req.headers['user-agent'] || data.user_agent || 'unknown',
          revoked_at: data.granted ? null : new Date(),
        }
      });

      res.status(200).json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  }
);
