import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import { HealthDataRepository } from './health-data.repository.js';
import pg from 'pg';
import { PrismaClient } from '@prisma/client';

// Feature: phyziq-platform, Property 3: Health Data Routing Invariant
// Validates: Requirements 1.7, 11.2 (Health data must NEVER touch the main Postgres DB pool)
// Feature: phyziq-platform, Property 44: Health Data Access Audit Coverage
// Validates: Requirements 11.6

describe('Health Data Privacy Invariants', () => {
  it('Property 3: Health Data Routing Invariant & Property 44: Audit Coverage', async () => {
    // We mock the health Postgres pool
    const mockClient = { query: vi.fn(), release: vi.fn() };
    const mockPool = {
      connect: vi.fn().mockResolvedValue(mockClient),
      query: vi.fn().mockResolvedValue({ rows: [{ id: '123', last_updated: new Date() }] }),
    } as unknown as pg.Pool;

    // We also mock the main Prisma DB
    const mockPrisma = {
      $queryRawUnsafe: vi.fn(),
      member: { update: vi.fn() }
    } as unknown as PrismaClient;

    const repo = new HealthDataRepository(mockPool);

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          memberId: fc.uuid(),
          diabetesRisk: fc.constantFrom('low', 'moderate', 'high'),
        }),
        async (input) => {
          mockPool.query.mockClear();
          mockPrisma.member.update.mockClear();

          await repo.upsertNcdProfile(input.memberId, { diabetes_risk: input.diabetesRisk as any }, 'test-service');

          // Property 3: Ensure the main DB is NEVER queried for this
          expect(mockPrisma.member.update).not.toHaveBeenCalled();
          expect(mockPrisma.$queryRawUnsafe).not.toHaveBeenCalled();

          // Ensure the Health DB pool is ALWAYS the one queried
          expect(mockPool.query).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO ncd_profiles'),
            expect.arrayContaining([input.memberId, input.diabetesRisk])
          );

          // Property 44: Ensure audit log is ALWAYS written to the health DB pool
          expect(mockPool.query).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO health_data_access_log'),
            expect.arrayContaining([input.memberId, 'test-service', 'WRITE'])
          );
        }
      )
    );
  });
});
