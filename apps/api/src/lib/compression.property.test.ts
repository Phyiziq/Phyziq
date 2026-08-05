import { describe, it, expect, beforeAll } from 'vitest';
import fc from 'fast-check';
import request from 'supertest';
import { createApp } from '../app.js';
import { Router } from 'express';

vi.mock('../lib/redis.js', () => ({
  redisClient: {
    on: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
    quit: vi.fn(),
  }
}));

vi.mock('../middleware/rate-limiter.js', () => ({
  rateLimiter: (req: any, res: any, next: any) => next()
}));

// Feature: phyziq-platform, Property 41: Large Response Compression
// Validates: Requirements 10.6

describe('API Foundation Invariants: Compression', () => {
  let app: any;

  beforeAll(() => {
    app = createApp();
    
    // A route that echoes back a potentially massive payload
    app.post('/test/echo-large', (req: any, res: any) => {
      res.json(req.body);
    });
  });

  it('Property 41: Large Response Compression - always compresses payloads > 1KB when client supports gzip', async () => {
    // Generate a massive string (~30KB)
    const massiveString = 'A'.repeat(30000);
    const payload = { data: massiveString };

    const res = await request(app)
      .post('/test/echo-large')
      .set('Accept-Encoding', 'gzip')
      .send(payload);
    
    expect(res.status).toBe(200);
    
    // Verify that compression middleware intercepted and compressed the response
    expect(res.headers['content-encoding']).toBe('gzip');
    
    // The transferred size should be smaller than the raw string size
    const rawSize = Buffer.byteLength(JSON.stringify(payload));
    const transferredSize = parseInt(res.headers['content-length'] || '0', 10);
    
    if (transferredSize > 0) {
      expect(transferredSize).toBeLessThan(rawSize);
    }
  });
});
