import { describe, it, expect, beforeAll, vi } from 'vitest';
import fc from 'fast-check';
import request from 'supertest';
import { createApp } from '../../app.js';
import { prisma } from '../../lib/db.js';

// Feature: phyziq-platform, Property 8.2: QR Code Pre-fill Consistency
// Validates: Requirements 12.1

vi.mock('../../middleware/rate-limiter.js', () => ({
  rateLimiter: (req: any, res: any, next: any) => next()
}));

describe('Onboarding Module Properties', () => {
  let app: any;

  beforeAll(async () => {
    app = createApp();
  });

  it('Property 8.2: Resolving a valid QR token must consistently return exact gym attributes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        fc.array(fc.string()),
        async (gymId, token, name, location, equipment) => {
          vi.spyOn(prisma.gymPartner, 'findFirst').mockImplementation(async (args: any) => {
            if (args?.where?.qr_code_token === token && args?.where?.is_active) {
              return {
                id: gymId,
                name: name,
                location: location,
                city: 'Nairobi',
                qr_code_token: token,
                equipment_list: equipment,
                owner_id: 'owner-id',
                is_active: true,
                created_at: new Date()
              } as any;
            }
            return null;
          });

          // Test Valid Token
          const validRes = await request(app)
            .post('/onboarding/qr-context')
            .send({ qr_code_token: token });
            
          expect(validRes.status).toBe(200);
          expect(validRes.body.success).toBe(true);
          expect(validRes.body.data.gym_id).toBe(gymId);
          expect(validRes.body.data.gym_name).toBe(name);
          expect(validRes.body.data.location).toBe(location);
          expect(validRes.body.data.equipment_list).toEqual(equipment);

          // Test Invalid Token (tampered)
          const invalidRes = await request(app)
            .post('/onboarding/qr-context')
            .send({ qr_code_token: token + '-tampered' });
            
          expect(invalidRes.status).toBe(404);
          expect(invalidRes.body.error.code).toBe('NOT_FOUND');
        }
      ),
      { numRuns: 20 }
    );
  });
});
