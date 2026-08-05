import { redisClient } from '../../lib/redis.js';
import { AppError } from '../../lib/app-error.js';

const OTP_TTL = 300; // 5 minutes

export class OtpService {
  /**
   * Requests an OTP for a given phone number.
   * Mocked for MVP to always use '0000' and log to console instead of sending SMS.
   */
  static async requestOtp(phone: string): Promise<void> {
    // In production, we would use Twilio or Africa's Talking here
    // and generate a random 4 or 6 digit code.
    const mockOtp = '0000';
    
    // Store in Redis
    await redisClient.set(`otp:${phone}`, mockOtp, 'EX', OTP_TTL);

    console.log(`[MOCK OTP] Sent code ${mockOtp} to ${phone}`);
  }

  /**
   * Verifies an OTP for a given phone number.
   * Throws an error if invalid or expired.
   */
  static async verifyOtp(phone: string, code: string): Promise<boolean> {
    const storedCode = await redisClient.get(`otp:${phone}`);

    if (!storedCode) {
      throw new AppError(400, 'OTP_EXPIRED', 'OTP code expired or not found.');
    }

    if (storedCode !== code) {
      throw new AppError(400, 'OTP_INVALID', 'Invalid OTP code.');
    }

    // Delete the code after successful verification
    await redisClient.del(`otp:${phone}`);

    return true;
  }
}
