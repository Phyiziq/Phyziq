import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fc from 'fast-check';
import request from 'supertest';
import { createApp } from '../../app.js';
import { prisma } from '../../lib/db.js';
import { HealthDataRepository } from './health-data.repository.js';
import { getHealthPool, closeHealthPool } from './health-db.js';
import { privacyQueue } from '../../workers/privacy-queue.js';
import jwt from 'jsonwebtoken';

// Feature: phyziq-platform, Property 7.3: Health Data Deletion After Consent Withdrawal
// Validates: Requirements 11.4

vi.mock('../../middleware/rate-limiter.js', () => ({
  rateLimiter: (req: any, res: any, next: any) => next()
}));

vi.mock('../auth/auth.middleware.js', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    req.auth = { sub: '00000000-0000-0000-0000-000000000001', role: 'member' };
    next();
  }
}));

// Mock BullMQ Queue so we don't actually hit Redis for queueing jobs
vi.mock('../../workers/privacy-queue.js', () => ({
  privacyQueue: {
    add: vi.fn()
  }
}));

vi.mock('../../lib/audit.js', () => ({
  insertComplianceEvent: vi.fn().mockResolvedValue({ id: 1n })
}));

describe('Consent Module Properties', () => {
  let app: any;

  beforeAll(async () => {
    app = createApp();
  });

  afterAll(async () => {
    await closeHealthPool();
  });

  it('Property 7.3: Revoking health data consent must strictly enqueue a deletion job', async () => {
    // Generate valid mock JWT for auth
    const token = jwt.sign(
      { sub: '00000000-0000-0000-0000-000000000001', role: 'member' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    // Mock prisma responses
    vi.spyOn(prisma.consentRecord, 'create').mockResolvedValue({
      id: 'mock-id',
      memberId: '00000000-0000-0000-0000-000000000001',
      consentType: 'health_data',
      granted: false,
      ipAddress: '127.0.0.1',
      userAgent: 'test',
      grantedAt: new Date(),
      revokedAt: new Date(),
    });

    await fc.assert(
      fc.asyncProperty(
        fc.boolean(), // test both true and false for 'granted'
        async (isGranted) => {
          vi.clearAllMocks();

          const res = await request(app)
            .post('/members/me/consent')
            .set('Authorization', `Bearer ${token}`)
            .send({
              consent_type: 'health_data',
              granted: isGranted
            });
          
          expect(res.status).toBe(200);
          
          if (isGranted) {
            // If granted, we should NOT enqueue a deletion job
            expect(privacyQueue.add).not.toHaveBeenCalled();
          } else {
            // If revoked, we MUST enqueue a deletion job
            expect(privacyQueue.add).toHaveBeenCalledWith(
              'delete-health-data',
              { memberId: '00000000-0000-0000-0000-000000000001' },
              expect.objectContaining({
                delay: 72 * 60 * 60 * 1000 // Exact 72h delay requirement
              })
            );
          }
        }
      ),
      { numRuns: 10 }
    );
  });
  
  it('Property 7.3b: HealthDataRepository.deleteAllHealthData must execute DELETE on isolated pool', async () => {
    const healthPool = getHealthPool();
    vi.spyOn(healthPool, 'connect').mockResolvedValue({
      query: vi.fn(),
      release: vi.fn()
    } as any);
    vi.spyOn(healthPool, 'query').mockResolvedValue({ rows: [] } as any);

    const repo = new HealthDataRepository(healthPool);
    
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (memberId) => {
          const clientMock = await healthPool.connect();
          vi.clearAllMocks();
          
          // Re-mock connect to return the same spy
          vi.spyOn(healthPool, 'connect').mockResolvedValue(clientMock as any);
          vi.spyOn(healthPool, 'query').mockResolvedValue({ rows: [] } as any);
          
          // Execute deletion
          await repo.deleteAllHealthData(memberId, 'test');
          
          // Verify transactions were used
          expect(clientMock.query).toHaveBeenCalledWith('BEGIN');
          expect(clientMock.query).toHaveBeenCalledWith('DELETE FROM ncd_profiles WHERE member_id = $1', [memberId]);
          expect(clientMock.query).toHaveBeenCalledWith('DELETE FROM biometric_logs WHERE member_id = $1', [memberId]);
          expect(clientMock.query).toHaveBeenCalledWith('COMMIT');
          expect(clientMock.release).toHaveBeenCalled();
        }
      ),
      { numRuns: 10 }
    );
  });
});
