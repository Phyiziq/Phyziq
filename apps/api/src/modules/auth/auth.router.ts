import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { OtpService } from './otp.service.js';
import { JwtService } from './jwt.service.js';
import { prisma } from '../../lib/db.js';

export const authRouter = Router();

const requestOtpSchema = z.object({
  phone: z.string().regex(/^\+\d{10,15}$/, 'Must be a valid E.164 phone number'),
});

const verifyOtpSchema = z.object({
  phone: z.string().regex(/^\+\d{10,15}$/, 'Must be a valid E.164 phone number'),
  code: z.string().length(4, 'Must be a 4-digit code'),
});

authRouter.post(
  '/otp/request',
  validate(requestOtpSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { phone } = req.body;
      await OtpService.requestOtp(phone);
      res.status(202).json({ success: true, data: { message: 'OTP requested successfully.' } });
    } catch (error) {
      next(error);
    }
  }
);

authRouter.post(
  '/otp/verify',
  validate(verifyOtpSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { phone, code } = req.body;
      
      // 1. Verify OTP
      await OtpService.verifyOtp(phone, code);

      // 2. UPSERT member
      const member = await prisma.member.upsert({
        where: { phone_number: phone },
        update: {},
        create: {
          phone_number: phone,
          // Defaults for new members - to be updated in registration flow
          first_name: 'New',
          last_name: 'Member',
          date_of_birth: new Date('2000-01-01'), // temporary placeholder
          sex: 'prefer_not_to_say',
          height_cm: 170,
          weight_kg: 70,
          fitness_goal: 'maintenance',
          activity_level: 'sedentary',
          subscription_status: 'free_preview',
        }
      });

      // 3. Issue JWT
      const accessToken = JwtService.issueAccessToken({
        sub: member.id,
        role: 'member',
        gym_id: member.gym_id,
      });

      res.status(200).json({
        success: true,
        data: {
          token: accessToken,
          member_id: member.id,
        }
      });
    } catch (error) {
      next(error);
    }
  }
);
