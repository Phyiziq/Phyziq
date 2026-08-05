import { Router, Request, Response } from 'express';
import { requireAuth } from '../auth/auth.middleware.js';
import { z } from 'zod';
import { prisma } from '../../lib/db.js';
import QRCode from 'qrcode'; // 24.5 Use qrcode package

export const gymsRouter = Router();

/**
 * 24.4 Implement gym dashboard API endpoint
 */
gymsRouter.get('/:id/dashboard', requireAuth, async (req: Request, res: Response) => {
  try {
    const gymId = req.params.id;
    // In a real implementation, we'd check if req.auth.sub belongs to a GymOwner who owns this gymId

    // Fetch the latest analytics snapshot
    const latestSnapshot = await prisma.gymAnalyticsSnapshot.findFirst({
      where: { gymId },
      orderBy: { snapshotAt: 'desc' }
    });

    if (!latestSnapshot) {
      return res.status(404).json({ error: 'No analytics data available yet' });
    }

    res.status(200).json({ success: true, data: latestSnapshot });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * 24.5 Implement QR code generation and download endpoint
 */
gymsRouter.get('/:id/qr-code', requireAuth, async (req: Request, res: Response) => {
  try {
    const gymId = req.params.id;

    const gym = await prisma.gymPartner.findUnique({
      where: { id: gymId }
    });

    if (!gym) {
      return res.status(404).json({ error: 'Gym not found' });
    }

    // Generate a QR code that members can scan to join the gym
    const qrData = `phyziq://join-gym?token=${gym.qrCodeToken}`;
    
    const format = req.query.format === 'svg' ? 'svg' : 'png';

    if (format === 'svg') {
      const qrSvgString = await QRCode.toString(qrData, {
        type: 'svg',
        width: 1000,
        margin: 2
      });
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Content-Disposition', `attachment; filename="gym-${gymId}-qrcode.svg"`);
      return res.status(200).send(qrSvgString);
    }
    
    // We use PNG format by default
    const qrImageBuffer = await QRCode.toBuffer(qrData, {
      type: 'png',
      width: 500,
      margin: 2
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="gym-${gymId}-qrcode.png"`);
    res.status(200).send(qrImageBuffer);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const createChallengeSchema = z.object({
  name: z.string().min(3),
  target_metric: z.string(),
  start_date: z.string().date(),
  end_date: z.string().date()
});

/**
 * 24.6 Implement cohort challenge creation
 */
gymsRouter.post('/:id/challenges', requireAuth, async (req: Request, res: Response) => {
  try {
    const gymId = req.params.id;
    const data = createChallengeSchema.parse(req.body);

    const challenge = await prisma.gymChallenge.create({
      data: {
        gymId,
        name: data.name,
        targetMetric: data.target_metric,
        startDate: new Date(data.start_date),
        endDate: new Date(data.end_date)
      }
    });

    res.status(201).json({ success: true, data: challenge });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

/**
 * 24.6 Implement leaderboard for challenge
 */
gymsRouter.get('/:id/challenges/:challengeId/leaderboard', requireAuth, async (req: Request, res: Response) => {
  try {
    const { challengeId } = req.params;

    const enrolments = await prisma.challengeEnrolment.findMany({
      where: { challengeId },
      include: {
        member: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    // Mocking leaderboard logic: we just randomize scores for MVP
    const leaderboard = enrolments.map(enrolment => ({
      member_name: `${enrolment.member.firstName} ${enrolment.member.lastName}`,
      score: Math.floor(Math.random() * 100)
    })).sort((a, b) => b.score - a.score);

    res.status(200).json({ success: true, data: leaderboard });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
