import { createClient } from 'redis';
import { config } from '../config/config.js';
import { logger } from '../logger/logger.js';

const redisUrl = config.get('redis.url');

export const redisClient = createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 3) {
        logger.warn('Redis connection failed after 3 retries');
        return false; // Stop retrying
      }
      return Math.min(retries * 100, 3000);
    }
  }
});

redisClient.on('error', (err) => {
  logger.error('Redis error:', err);
});

redisClient.on('connect', () => {
  logger.info('Redis connected');
});

export async function initializeRedis() {
  try {
    await redisClient.connect();
  } catch (error) {
    logger.error('Failed to connect Redis:', error);
    throw error;
  }
}

export async function closeRedis() {
  await redisClient.quit();
}
