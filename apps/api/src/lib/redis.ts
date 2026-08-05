import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const isRedisDisabled = (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') && 
                                (redisUrl.includes('localhost') || redisUrl.includes('127.0.0.1')) && 
                                process.env.ENABLE_REDIS !== 'true';

let client: any;

if (isRedisDisabled) {
  console.warn('⚠️  Redis is local in DEV mode. Redis client is MOCKED to prevent ECONNREFUSED spam.');
  client = {
    on: () => client,
    get: async () => null,
    set: async () => 'OK',
    del: async () => 1,
    quit: async () => 'OK',
    status: 'ready',
    duplicate: () => client,
  };
} else {
  client = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  let errorLogged = false;
  client.on('error', (err: any) => {
    if (!errorLogged) {
      console.error('Redis Client Error (Only logging once):', err.message);
      errorLogged = true;
    }
  });
}

export const redisClient = client;
