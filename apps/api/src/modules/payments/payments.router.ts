import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../auth/auth.middleware.js';
import { z } from 'zod';
import { prisma } from '../../lib/db.js';
import { PaymentModule } from './payments.service.js';

export const paymentsRouter = Router();

/**
 * 20.7 Pre-payment fee disclosure middleware
 */
const feeDisclosureMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // In a real app, this would append a mandatory fee disclosure agreement to the response
  // or validate that the client passed a 'fee_accepted: true' flag.
  const { fee_accepted } = req.body;
  if (!fee_accepted) {
    return res.status(400).json({ error: 'You must accept the fee disclosure to proceed.' });
  }
  next();
};

const initiateSchema = z.object({
  amount_kes: z.number().positive(),
  payment_rail: z.enum(['paystack', 'mpesa']),
  transaction_type: z.enum(['plan_unlock', 'subscription', 'coach_booking']),
  plan_id: z.string().uuid().optional(),
  coach_id: z.string().uuid().optional(),
  fee_accepted: z.boolean()
});

paymentsRouter.post('/initiate', requireAuth, feeDisclosureMiddleware, async (req: Request, res: Response) => {
  try {
    const data = initiateSchema.parse(req.body);
    const memberId = req.auth!.sub;

    const result = await PaymentModule.initiatePayment({
      memberId,
      amountKes: data.amount_kes,
      paymentRail: data.payment_rail,
      transactionType: data.transaction_type,
      planId: data.plan_id,
      coachId: data.coach_id
    });

    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(error.statusCode || 500).json({ error: error.message || 'Internal Server Error' });
    }
  }
});

paymentsRouter.post('/webhook/paystack', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-paystack-signature'] as string;
    if (!signature) return res.status(401).json({ error: 'Missing signature' });

    const isValid = PaymentModule.verifyPaystackWebhook(req.body, signature);
    if (!isValid) return res.status(401).json({ error: 'Invalid signature' });

    const event = req.body;
    if (event.event === 'charge.success') {
      const tx = await prisma.paymentTransaction.findUnique({
        where: { idempotencyKey: event.data.reference }
      });

      if (tx && tx.status !== 'confirmed') {
        await PaymentModule.confirmPayment(tx.id, event.data.id.toString(), event.data.amount / 100);
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

paymentsRouter.get('/history', requireAuth, async (req: Request, res: Response) => {
  try {
    const memberId = req.auth!.sub;

    const txs = await prisma.paymentTransaction.findMany({
      where: { memberId },
      orderBy: { initiatedAt: 'desc' },
      take: 50
    });

    res.status(200).json({ success: true, data: txs });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
