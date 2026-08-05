import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { JwtService, JwtPayload } from './jwt.service.js';
import jwt from 'jsonwebtoken';

describe('Auth Module Properties', () => {
  it('Property 42: JWT Token Expiry - should issue tokens expiring in exactly 24 hours', () => {
    fc.assert(
      fc.property(
        fc.record({
          sub: fc.uuid(),
          role: fc.constantFrom<'member', 'gym_owner', 'coach', 'admin'>('member', 'gym_owner', 'coach', 'admin'),
          gym_id: fc.oneof(fc.constant(null), fc.uuid()),
        }),
        (payload: JwtPayload) => {
          const token = JwtService.issueAccessToken(payload);
          const decoded = jwt.decode(token) as jwt.JwtPayload;
          
          expect(decoded).toBeDefined();
          expect(decoded.exp).toBeDefined();
          expect(decoded.iat).toBeDefined();
          
          const diffInSeconds = decoded.exp! - decoded.iat!;
          expect(diffInSeconds).toBe(24 * 60 * 60); // Exactly 24 hours
        }
      )
    );
  });

  it('Property: JWT Payload integrity - tampering should invalidate token', () => {
    fc.assert(
      fc.property(
        fc.record({
          sub: fc.uuid(),
          role: fc.constantFrom<'member', 'gym_owner', 'coach', 'admin'>('member', 'gym_owner', 'coach', 'admin'),
          gym_id: fc.oneof(fc.constant(null), fc.uuid()),
        }),
        (payload: JwtPayload) => {
          const token = JwtService.issueAccessToken(payload);
          const parts = token.split('.');
          
          // Modify payload slightly
          const tamperedPayload = Buffer.from(parts[1], 'base64').toString('utf8') + ' ';
          const tamperedToken = `${parts[0]}.${Buffer.from(tamperedPayload).toString('base64')}.${parts[2]}`;
          
          expect(() => JwtService.verifyAccessToken(tamperedToken)).toThrow();
        }
      )
    );
  });
});
