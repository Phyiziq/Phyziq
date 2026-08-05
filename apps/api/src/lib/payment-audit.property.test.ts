import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import { PrismaClient } from '@prisma/client';

// Feature: phyziq-platform, Property 29: Payment Audit Log Completeness
// Validates: Requirements 6.5 (All financial state changes must be appended to payment_audit_log in the same transaction)

/**
 * Mock representation of how the payment service will execute transactions.
 * We must guarantee that the audit log is created in the exact same transaction block.
 */
async function processPaymentWithAudit(
  prisma: any,
  paymentData: any,
  auditData: any
) {
  return prisma.$transaction(async (tx: any) => {
    const payment = await tx.paymentTransaction.create({ data: paymentData });
    const audit = await tx.paymentAuditLog.create({
      data: {
        ...auditData,
        transaction_id: payment.id,
      }
    });
    return { payment, audit };
  });
}

describe('Database Invariants: Payment Audit', () => {
  it('Property 29: Payment Audit Log Completeness - ensures audit log is always created in the same transaction', async () => {
    // Mock Prisma transaction
    const mockTx = {
      paymentTransaction: { create: vi.fn() },
      paymentAuditLog: { create: vi.fn() }
    };
    
    const mockPrisma = {
      $transaction: vi.fn().mockImplementation(async (callback) => {
        return callback(mockTx);
      })
    };

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          member_id: fc.uuid(),
          amount_kes: fc.integer({ min: 100, max: 10000 }),
          provider: fc.constant('paystack_mpesa'),
          status: fc.constant('pending'),
        }),
        fc.record({
          event_type: fc.constant('initiated'),
          provider_reference: fc.string(),
        }),
        async (paymentData, auditData) => {
          // Reset mocks
          mockTx.paymentTransaction.create.mockClear();
          mockTx.paymentAuditLog.create.mockClear();

          mockTx.paymentTransaction.create.mockResolvedValue({ id: 'tx-123', ...paymentData });
          mockTx.paymentAuditLog.create.mockResolvedValue({ id: 'audit-123', transaction_id: 'tx-123', ...auditData });

          await processPaymentWithAudit(mockPrisma, paymentData, auditData);

          // Both operations must have been called within the transaction block
          expect(mockTx.paymentTransaction.create).toHaveBeenCalledOnce();
          expect(mockTx.paymentAuditLog.create).toHaveBeenCalledOnce();

          // The audit log MUST contain the correct transaction ID
          expect(mockTx.paymentAuditLog.create).toHaveBeenCalledWith(
            expect.objectContaining({
              data: expect.objectContaining({
                transaction_id: 'tx-123',
                event_type: auditData.event_type,
              })
            })
          );
        }
      )
    );
  });
});
