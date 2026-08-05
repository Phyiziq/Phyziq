import { Request, Response, NextFunction } from 'express';
import { JwtService, JwtPayload } from './jwt.service.js';
import { AppError } from '../../lib/app-error.js';

// Extend Express Request interface to include the auth payload
declare global {
  namespace Express {
    interface Request {
      auth?: JwtPayload;
    }
  }
}

/**
 * Middleware to protect routes that require authentication.
 * Verifies the JWT from the Authorization header and attaches the payload to req.auth.
 */
export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError(401, 'UNAUTHORIZED', 'Authentication required. No token provided.'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = JwtService.verifyAccessToken(token);
    req.auth = payload;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError(401, 'TOKEN_EXPIRED', 'Your access token has expired. Please refresh.'));
    }
    return next(new AppError(401, 'UNAUTHORIZED', 'Invalid token.'));
  }
};
