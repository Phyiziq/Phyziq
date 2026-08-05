import { prisma } from '../../lib/db.js';
import crypto from 'crypto';
import { AppError } from '../../lib/app-error.js';

export class PaymentModule {
  /**
   * 19.1 Initiate Payment
   * Routes payment through Paystack or M-Pesa STK push.
   */
  static async initiatePayment(params: {
    memberId: string;
    amountKes: number;
    paymentRail: 'paystack' | 'mpesa';
    transactionType: 'plan_unlock' | 'subscription' | 'coach_booking';
    planId?: string;
    coachId?: string;
  }) {
    const idempotencyKey = crypto.randomUUID();

    const tx = await prisma.paymentTransaction.create({
      data: {
        memberId: params.memberId,
        amountKes: params.amountKes,
        paymentMethod: params.paymentRail === 'mpesa' ? 'mobile_money' : 'card',
        paymentRail: params.paymentRail,
        transactionType: params.transactionType,
        planId: params.planId,
        coachId: params.coachId,
        idempotencyKey,
        status: 'pending'
      }
    });

    // Mock API calls to external gateways
    if (params.paymentRail === 'paystack') {
      // Mock Paystack URL generation
      return {
        transactionId: tx.id,
        checkoutUrl: `https://checkout.paystack.com/mock_${tx.id}`,
        idempotencyKey
      };
    } else if (params.paymentRail === 'mpesa') {
      // Mock STK Push initiation
      return {
        transactionId: tx.id,
        message: 'STK Push initiated. Check your phone.',
        idempotencyKey
      };
    } else {
      throw new AppError(400, 'INVALID_RAIL', 'Unsupported payment rail');
    }
  }

  /**
   * 19.3 Verify Webhook Signature (Paystack HMAC)
   */
  static verifyPaystackWebhook(payload: any, signature: string, secret: string = 'mock_secret'): boolean {
    const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(payload)).digest('hex');
    return hash === signature;
  }

  /**
   * 20.1 Plan Unlock on Confirmation
   */
  static async confirmPayment(transactionId: string, gatewayRef: string, gatewayAmount: number) {
    const tx = await prisma.paymentTransaction.update({
      where: { id: transactionId },
      data: {
        status: 'confirmed',
        confirmedAt: new Date(),
        gatewayRef,
        gatewayAmount
      }
    });

    // Audit log (omitted lib/audit.ts import to avoid missing dependencies, using Prisma raw query/create mock)
    // Normally goes through insertPaymentAuditLog
    await prisma.$executeRaw`
      INSERT INTO payment_audit_log (transaction_id, event_type, event_data)
      VALUES (${tx.id}::uuid, 'status_update', '{"status":"confirmed"}'::jsonb)
    `;

    if (tx.transactionType === 'plan_unlock' && tx.planId) {
      await prisma.adaptivePlan.update({
        where: { id: tx.planId },
        data: { isPaid: true }
      });
      // also update member's subscription status
      await prisma.member.update({
        where: { id: tx.memberId! },
        data: { subscriptionStatus: 'premium' }
      });
    } else if (tx.transactionType === 'coach_booking' && tx.coachId) {
      // We'd find the pending coach booking and mark it paid (handled in Marketplace normally)
      await prisma.coachBooking.updateMany({
        where: { paymentId: tx.id },
        data: { status: 'confirmed' }
      });
    }

    return tx;
  }
}
