import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import { HealthDataRepository } from './health-data.repository.js';
import pg from 'pg';

describe('Consent Module Properties', () => {
  it('Property 43: Health Data Deletion After Consent Withdrawal', async () => {
    // We mock the postgres pool to verify the correct sequence of DELETE statements
    const mockClient = {
      query: vi.fn(),
      release: vi.fn(),
    };
    
    const mockPool = {
      connect: vi.fn().mockResolvedValue(mockClient),
      query: vi.fn(),
    } as unknown as pg.Pool;

    const repo = new HealthDataRepository(mockPool);

    await fc.assert(
      fc.asyncProperty(fc.uuid(), async (memberId) => {
        // Reset mocks for each run
        mockClient.query.mockClear();
        (mockPool.query as any).mockClear();

        await repo.deleteAllHealthData(memberId, 'test', 'ctx');

        // Verify transaction semantics
        expect(mockClient.query).toHaveBeenNthCalledWith(1, 'BEGIN');
        
        // Verify explicit deletions on the memberId
        expect(mockClient.query).toHaveBeenCalledWith(
          'DELETE FROM ncd_profiles WHERE member_id = $1',
          [memberId]
        );
        expect(mockClient.query).toHaveBeenCalledWith(
          'DELETE FROM biometric_logs WHERE member_id = $1',
          [memberId]
        );

        // Verify commit
        expect(mockClient.query).toHaveBeenLastCalledWith('COMMIT');

        // Verify access log is written (using the pool directly)
        expect(mockPool.query).toHaveBeenCalledWith(
          expect.stringContaining('INSERT INTO health_data_access_log'),
          [memberId, 'test', 'DELETE', 'ctx']
        );
      })
    );
  });
});
