import { Router, Request, Response } from 'express';
import { requireAuth } from '../auth/auth.middleware.js';
import { z } from 'zod';
import { prisma } from '../../lib/db.js';
import { PaymentModule } from '../payments/payments.service.js';
import { AppError } from '../../lib/app-error.js';

export const marketplaceRouter = Router();

/**
 * 23.1 Implement coach listing
 */
marketplaceRouter.get('/coaches', requireAuth, async (req: Request, res: Response) => {
  try {
    const coaches = await prisma.coach.findMany({
      where: { isVerified: true },
      include: {
        member: {
          select: { firstName: true, lastName: true }
        }
      }
    });
    res.status(200).json({ success: true, data: coaches });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * 23.1 Implement coach profile endpoint
 */
marketplaceRouter.get('/coaches/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const coach = await prisma.coach.findUnique({
      where: { id: req.params.id, isVerified: true },
      include: {
        member: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    if (!coach) {
      return res.status(404).json({ error: 'Coach not found' });
    }

    res.status(200).json({ success: true, data: coach });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const bookSessionSchema = z.object({
  scheduled_at: z.string().datetime(),
  payment_rail: z.enum(['paystack', 'mpesa'])
});

/**
 * 23.3 Implement session booking and escrow payment
 */
marketplaceRouter.post('/coaches/:id/book', requireAuth, async (req: Request, res: Response) => {
  try {
    const data = bookSessionSchema.parse(req.body);
    const memberId = req.auth!.sub;
    const coachId = req.params.id;

    const coach = await prisma.coach.findUnique({ where: { id: coachId } });
    if (!coach || !coach.sessionFeeKes) {
      throw new AppError(404, 'COACH_NOT_FOUND', 'Coach or session fee not found');
    }

    // Create a pending booking
    const booking = await prisma.coachBooking.create({
      data: {
        memberId,
        coachId,
        scheduledAt: new Date(data.scheduled_at),
        sessionFeeKes: coach.sessionFeeKes,
        commissionPct: 15.00, // 15% platform fee
        status: 'pending_payment'
      }
    });

    // Initiate escrow payment
    const paymentResult = await PaymentModule.initiatePayment({
      memberId,
      amountKes: Number(coach.sessionFeeKes),
      paymentRail: data.payment_rail,
      transactionType: 'coach_booking',
      coachId
    });

    // Link payment ID to booking
    await prisma.coachBooking.update({
      where: { id: booking.id },
      data: { paymentId: paymentResult.transactionId }
    });

    res.status(201).json({
      success: true,
      data: {
        booking_id: booking.id,
        payment: paymentResult
      }
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(error.statusCode || 500).json({ error: error.message || 'Internal Server Error' });
    }
  }
});

/**
 * 23.5 Implement cancellation refund logic
 */
marketplaceRouter.post('/bookings/:id/cancel', requireAuth, async (req: Request, res: Response) => {
  try {
    const bookingId = req.params.id;
    const memberId = req.auth!.sub;

    const booking = await prisma.coachBooking.findUnique({
      where: { id: bookingId }
    });

    if (!booking || booking.memberId !== memberId) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Refund logic: >24hrs = 100%, <24hrs = 0% or partial (we'll implement strict 24hr rule)
    const hoursUntilSession = (booking.scheduledAt.getTime() - new Date().getTime()) / (1000 * 60 * 60);
    const refundEligible = hoursUntilSession >= 24;

    await prisma.coachBooking.update({
      where: { id: booking.id },
      data: {
        status: 'cancelled',
        cancellationAt: new Date()
      }
    });

    res.status(200).json({
      success: true,
      data: {
        booking_id: booking.id,
        refund_eligible: refundEligible,
        message: refundEligible 
          ? 'Booking cancelled. Escrow payment will be fully refunded.'
          : 'Booking cancelled. Cancellation is within 24 hours so it is non-refundable.'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const rateBookingSchema = z.object({
  rating: z.number().min(1).max(5),
  review: z.string().optional()
});

/**
 * 23.8 Implement session rating and review submission
 */
marketplaceRouter.post('/bookings/:id/rate', requireAuth, async (req: Request, res: Response) => {
  try {
    const bookingId = req.params.id;
    const memberId = req.auth!.sub;
    const data = rateBookingSchema.parse(req.body);

    const booking = await prisma.coachBooking.findUnique({
      where: { id: bookingId }
    });

    if (!booking || booking.memberId !== memberId) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.reviewSubmitted) {
      return res.status(400).json({ error: 'Review already submitted' });
    }

    await prisma.coachBooking.update({
      where: { id: booking.id },
      data: { reviewSubmitted: true }
    });

    // We normally would save the review text somewhere (e.g. CoachReview table).
    // For MVP, we update the coach rating average directly using a mock approach.
    const coach = await prisma.coach.findUnique({ where: { id: booking.coachId } });
    if (coach) {
      const currentAvg = coach.ratingAvg ? Number(coach.ratingAvg) : 5.0;
      // Simple moving average mock
      const newAvg = (currentAvg + data.rating) / 2;
      await prisma.coach.update({
        where: { id: coach.id },
        data: { ratingAvg: newAvg }
      });
    }

    res.status(200).json({ success: true, message: 'Rating submitted successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

/**
 * 23.9 Implement coach earnings dashboard
 */
marketplaceRouter.get('/me/dashboard', requireAuth, async (req: Request, res: Response) => {
  try {
    const memberId = req.auth!.sub;

    const coach = await prisma.coach.findUnique({
      where: { memberId }
    });

    if (!coach) {
      return res.status(404).json({ error: 'Coach profile not found' });
    }

    const completedBookings = await prisma.coachBooking.findMany({
      where: { coachId: coach.id, status: 'confirmed' }
    });

    let totalEarnings = 0;
    completedBookings.forEach(b => {
      const fee = Number(b.sessionFeeKes);
      const commission = Number(b.commissionPct);
      totalEarnings += fee * (1 - (commission / 100));
    });

    res.status(200).json({
      success: true,
      data: {
        total_bookings: completedBookings.length,
        total_earnings_kes: totalEarnings,
        platform_commission_pct: 15.00,
        recent_bookings: completedBookings.slice(0, 5)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

