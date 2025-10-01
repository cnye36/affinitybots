import Redis from 'ioredis';

/**
 * Shared Redis connection utility
 * 
 * This provides a singleton Redis connection that's shared across the application.
 * Uses the same Redis instance as LangGraph with namespace isolation via key prefixes.
 * 
 * Namespaces:
 * - LangGraph: (default keys for checkpointing)
 * - Rate Limiting: rate_limit:*, daily_usage:*, daily_reset:*
 * - Scheduler: bull:scheduler:* (BullMQ queues)
 */

let redisInstance: Redis | null = null;
let connecting: Promise<Redis> | null = null;

export function getRedisConnection(): Redis {
  if (redisInstance) {
    return redisInstance;
  }

  // Support both REDIS_URL (Next.js env) and REDIS_URI (LangGraph compose env)
  const configuredUrl = process.env.REDIS_URL || process.env.REDIS_URI;
  const redisUrl = configuredUrl ||
    (process.env.NODE_ENV === 'production' 
      ? 'redis://langgraph-redis:6379' 
      : 'redis://localhost:6379');

  redisInstance = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    db: 0, // Upstash supports only DB 0; use 0 for compatibility
    enableOfflineQueue: true,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  redisInstance.on('connect', () => {
    console.log('✅ Redis connected');
  });

  redisInstance.on('error', (error) => {
    console.error('❌ Redis connection error:', error.message);
  });

  redisInstance.on('close', () => {
    console.log('🔌 Redis connection closed');
  });

  return redisInstance;
}

/**
 * Connect to Redis with promise for async initialization
 */
export async function connectRedis(): Promise<Redis> {
  const redis = getRedisConnection();
  
  // If already connected, return immediately
  if (redis.status === 'ready') {
    return redis;
  }

  // If currently connecting, wait for that connection
  if (connecting) {
    return connecting;
  }

  // Start new connection
  connecting = redis.connect().then(() => {
    connecting = null;
    return redis;
  }).catch((error) => {
    connecting = null;
    console.error('Failed to connect to Redis:', error);
    throw error;
  });

  return connecting;
}

/**
 * Gracefully close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redisInstance) {
    await redisInstance.quit();
    redisInstance = null;
  }
}

/**
 * Get Redis URL for external libraries (like BullMQ)
 */
export function getRedisUrl(): string {
  const configuredUrl = process.env.REDIS_URL || process.env.REDIS_URI;
  return configuredUrl ||
    (process.env.NODE_ENV === 'production' 
      ? 'redis://langgraph-redis:6379' 
      : 'redis://localhost:6379');
}

// Graceful shutdown handlers
if (typeof process !== 'undefined') {
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing Redis connection...');
    await closeRedis();
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, closing Redis connection...');
    await closeRedis();
  });
}

