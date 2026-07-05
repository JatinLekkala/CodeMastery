const Redis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null, // BullMQ/custom queues recommend this
});

redisClient.on('connect', () => {
  console.log('Redis Connected successfully');
});

redisClient.on('error', (err) => {
  console.error('Redis Connection Error:', err);
});

// Helper to create dynamic new Redis connections (e.g. for blocking pop, pub/sub)
const createRedisClient = () => {
  return new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
  });
};

module.exports = {
  redisClient,
  createRedisClient,
};
