import { Router, Request, Response } from 'express';
import { requireAuth } from '../auth/auth.middleware.js';

export const sseRouter = Router();

// Store active connections
const clients = new Map<string, Response>();

sseRouter.get('/stream', requireAuth, (req: Request, res: Response) => {
  const memberId = req.auth!.sub;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send an initial heartbeat
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

  clients.set(memberId, res);

  req.on('close', () => {
    clients.delete(memberId);
  });
});

export function broadcastEvent(memberId: string, eventData: any) {
  const client = clients.get(memberId);
  if (client) {
    client.write(`data: ${JSON.stringify(eventData)}\n\n`);
  }
}
