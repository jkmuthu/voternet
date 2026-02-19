import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redisClient } from '../libraries/redis/redis.js';
import { config } from '../libraries/config/config.js';

let store: any;

// Try to use Redis store, fall back to memory store for local development
try {
  if (redisClient && (redisClient as any).isOpen) {
    store = new RedisStore({
      sendCommand: async (...args: string[]) => {
        return await (redisClient as any).sendCommand(args);
      }
    } as any);
  } else {
    // Use default in-memory store for development
    store = undefined;
  }
} catch (error) {
  // Fall back to in-memory store if Redis is not available
  console.warn('Redis not available, using in-memory rate limiter');
  store = undefined;
}

export const rateLimiter = rateLimit({
  store: store,
  windowMs: config.get('rateLimit.windowMs'),
  max: config.get('rateLimit.maxRequests'),
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health check
    return req.path === '/health';
  }
});
