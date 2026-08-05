import { Queue as RealQueue, Worker as RealWorker, QueueOptions, WorkerOptions, Processor, Job } from 'bullmq';
import { isRedisDisabled } from './redis.js';

export { Job };

export class Queue {
  name: string;
  constructor(name: string, opts?: QueueOptions) {
    this.name = name;
    if (!isRedisDisabled) {
      return new RealQueue(name, opts) as any;
    }
    console.warn(`[Mock] Queue ${name} initialized in-memory.`);
  }

  async add(name: string, data: any, opts?: any) {
    if (!isRedisDisabled) {
      // This is technically unreachable because constructor returns RealQueue
    }
    console.log(`[Mock] Added job ${name} to queue ${this.name}`);
    return { id: `mock-${Date.now()}`, data };
  }

  async close() {}
  on() { return this; }
}

export class Worker {
  name: string;
  constructor(name: string, processor: Processor<any, any, string>, opts?: WorkerOptions) {
    this.name = name;
    if (!isRedisDisabled) {
      return new RealWorker(name, processor, opts) as any;
    }
    console.warn(`[Mock] Worker ${name} initialized in-memory.`);
  }

  async close() {}
  on() { return this; }
}
