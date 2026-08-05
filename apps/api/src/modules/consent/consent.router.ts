import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { prisma } from '../../lib/db.js';
import { requireAuth } from '../auth/auth.middleware.js';
import { insertComplianceEvent } from '../../lib/audit.js';
import { privacyQueue } from '../../workers/privacy-queue.js';

export const consentRouter = Router();

const setConsentSchema = z.object({
  consent_type: z.enum(['general', 'health_data', 'ai_training']),
  granted: z.boolean(),
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
});

consentRouter.get(
  '/',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const memberId = req.auth!.sub;
      
      const records = await prisma.consentRecord.findMany({
        where: { memberId },
        orderBy: { grantedAt: 'desc' }
      });
      
      // Get the latest status for each type
      const latestConsents = ['general', 'health_data', 'ai_training'].map(type => {
        const record = records.find(r => r.consentType === type);
        return {
          consent_type: type,
          granted: record ? record.granted : false,
          revoked_at: record ? record.revokedAt : null,
          granted_at: record ? record.grantedAt : null,
        };
      });

      res.status(200).json({ success: true, data: latestConsents });
    } catch (error) {
      next(error);
    }
  }
);

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
          memberId: memberId,
          consentType: data.consent_type,
          granted: data.granted,
          ipAddress: req.ip || data.ip_address || 'unknown',
          userAgent: req.headers['user-agent'] || data.user_agent || 'unknown',
          revokedAt: data.granted ? null : new Date(),
        }
      });

      // Log compliance event
      await insertComplianceEvent({
        memberId: memberId,
        eventType: data.granted ? 'consent_granted' : 'consent_revoked',
        eventData: { consent_type: data.consent_type, record_id: record.id }
      });

      // If health_data consent is revoked, enqueue 72h deletion job
      if (data.consent_type === 'health_data' && !data.granted) {
        await privacyQueue.add(
          'delete-health-data',
          { memberId },
          { delay: 72 * 60 * 60 * 1000, jobId: `delete-health-${memberId}-${Date.now()}` }
        );
      }

      res.status(200).json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  }
);
