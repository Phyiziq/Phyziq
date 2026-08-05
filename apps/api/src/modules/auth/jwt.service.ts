import jwt from 'jsonwebtoken';

// Using a hardcoded secret for dev/MVP purposes if env var is missing
const JWT_SECRET = process.env.JWT_SECRET || 'phyziq-mvp-super-secret-key-512bit-needs-to-be-long-enough';

export interface JwtPayload {
  sub: string;
  role: 'member' | 'gym_owner' | 'coach' | 'admin';
  gym_id: string | null;
}

export class JwtService {
  /**
   * Issues a new JWT access token valid for 24 hours.
   */
  static issueAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
  }

  /**
   * Verifies an access token and returns the decoded payload.
   * Throws an error if expired or invalid.
   */
  static verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  }
}
