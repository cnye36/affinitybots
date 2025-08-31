import Redis from 'ioredis';
import { z } from 'zod';

// Rate limiting configuration based on GPT-5 pricing
const RATE_LIMIT_CONFIG = {
  // GPT-5 pricing (per 1M tokens)
  INPUT_TOKEN_COST_PER_MILLION: 1.25,  // $1.25 per 1M input tokens
  OUTPUT_TOKEN_COST_PER_MILLION: 10.00, // $10.00 per 1M output tokens
  
  // Daily spending limit
  DAILY_SPENDING_LIMIT: 1.00, // $1.00 per day
  
  // Redis key prefixes
  REDIS_KEY_PREFIX: 'rate_limit:',
  DAILY_USAGE_PREFIX: 'daily_usage:',
  DAILY_RESET_PREFIX: 'daily_reset:',
  
  // Time windows
  DAILY_WINDOW_MS: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  RESET_BUFFER_MS: 5 * 60 * 1000, // 5 minutes buffer for timezone differences
} as const;

// Token usage tracking schema
const TokenUsageSchema = z.object({
  userId: z.string(),
  inputTokens: z.number().min(0),
  outputTokens: z.number().min(0),
  timestamp: z.number(),
  model: z.string().optional(),
  sessionId: z.string().optional(),
});

export type TokenUsage = z.infer<typeof TokenUsageSchema>;

// Daily usage summary schema
const DailyUsageSchema = z.object({
  userId: z.string(),
  date: z.string(), // YYYY-MM-DD format
  totalInputTokens: z.number().min(0),
  totalOutputTokens: z.number().min(0),
  totalCost: z.number().min(0),
  requestCount: z.number().min(0),
  lastUpdated: z.number(),
});

export type DailyUsage = z.infer<typeof DailyUsageSchema>;

// Rate limit result
export interface RateLimitResult {
  allowed: boolean;
  remainingBudget: number;
  dailyUsage: DailyUsage;
  resetTime: number;
  reason?: string;
}

// Rate limit error
export class RateLimitError extends Error {
  constructor(
    message: string,
    public remainingBudget: number,
    public resetTime: number,
    public dailyUsage: DailyUsage
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

class RateLimiter {
  private redis: Redis;
  private isConnected = false;
  private connecting: Promise<void> | null = null;

  constructor() {
    // Use the same Redis as LangGraph but with database 1 for rate limiting
    // In Docker environment, use the container name; otherwise fallback to localhost
    // Support both REDIS_URL (Next.js env) and REDIS_URI (LangGraph compose env)
    const configuredUrl = process.env.REDIS_URL || process.env.REDIS_URI;
    const redisUrl = configuredUrl ||
                    (process.env.NODE_ENV === 'production' ? 'redis://langgraph-redis:6379' : 'redis://localhost:6379');
    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      db: 0, // Upstash supports only DB 0; use 0 for compatibility
    });

    this.redis.on('connect', () => {
      console.log('✅ Redis connected for rate limiting');
      this.isConnected = true;
    });

    this.redis.on('error', (error) => {
      console.error('❌ Redis connection error:', error);
      this.isConnected = false;
    });

    this.redis.on('close', () => {
      console.log('🔌 Redis connection closed');
      this.isConnected = false;
    });

    // Defer connecting until first use to avoid build-time connections
  }

  private async connect(): Promise<void> {
    if (this.isConnected) return;
    if (this.connecting) {
      try { await this.connecting; } catch {}
      return;
    }
    this.connecting = this.redis.connect().finally(() => {
      this.connecting = null;
    });
    try {
      await this.connecting;
    } catch (error) {
      this.isConnected = false;
      console.warn('Redis connect error:', error);
    }
  }

  /**
   * Calculate the cost of tokens based on GPT-5 pricing
   */
  private calculateTokenCost(inputTokens: number, outputTokens: number): number {
    const inputCost = (inputTokens / 1_000_000) * RATE_LIMIT_CONFIG.INPUT_TOKEN_COST_PER_MILLION;
    const outputCost = (outputTokens / 1_000_000) * RATE_LIMIT_CONFIG.OUTPUT_TOKEN_COST_PER_MILLION;
    return inputCost + outputCost;
  }

  /**
   * Get the current date in YYYY-MM-DD format (UTC)
   */
  private getCurrentDate(): string {
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, '0');
    const d = String(now.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * Get the next reset time (next day at 00:00 UTC)
   */
  private getNextResetTime(): number {
    const now = new Date();
    const tomorrow = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0, 0, 0, 0
    ));
    return tomorrow.getTime();
  }

  /**
   * Get Redis key for daily usage
   */
  private getDailyUsageKey(userId: string, date: string): string {
    return `${RATE_LIMIT_CONFIG.REDIS_KEY_PREFIX}${RATE_LIMIT_CONFIG.DAILY_USAGE_PREFIX}${userId}:${date}`;
  }

  /**
   * Get Redis key for daily reset time
   */
  private getDailyResetKey(userId: string): string {
    return `${RATE_LIMIT_CONFIG.REDIS_KEY_PREFIX}${RATE_LIMIT_CONFIG.DAILY_RESET_PREFIX}${userId}`;
  }

  /**
   * Get or create daily usage record
   */
  private async getDailyUsage(userId: string, date: string): Promise<DailyUsage> {
    const key = this.getDailyUsageKey(userId, date);
    
    try {
      const cached = await this.redis.get(key);
      if (cached) {
        return DailyUsageSchema.parse(JSON.parse(cached));
      }
    } catch (error) {
      console.warn('Failed to parse cached daily usage:', error);
    }

    // Create new daily usage record
    const dailyUsage: DailyUsage = {
      userId,
      date,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCost: 0,
      requestCount: 0,
      lastUpdated: Date.now(),
    };

    // Cache for 48 hours (2 days) to handle timezone edge cases
    await this.redis.setex(key, 48 * 60 * 60, JSON.stringify(dailyUsage));
    return dailyUsage;
  }

  /**
   * Update daily usage record
   */
  private async updateDailyUsage(dailyUsage: DailyUsage): Promise<void> {
    const key = this.getDailyUsageKey(dailyUsage.userId, dailyUsage.date);
    dailyUsage.lastUpdated = Date.now();
    
    // Cache for 48 hours
    await this.redis.setex(key, 48 * 60 * 60, JSON.stringify(dailyUsage));
  }

  /**
   * Check if rate limit allows the request
   */
  async checkRateLimit(
    userId: string,
    estimatedInputTokens: number = 0,
    estimatedOutputTokens: number = 0
  ): Promise<RateLimitResult> {
    await this.connect();
    if (!this.isConnected) {
      console.warn('Redis not connected, allowing request');
      return {
        allowed: true,
        remainingBudget: RATE_LIMIT_CONFIG.DAILY_SPENDING_LIMIT,
        dailyUsage: {
          userId,
          date: this.getCurrentDate(),
          totalInputTokens: 0,
          totalOutputTokens: 0,
          totalCost: 0,
          requestCount: 0,
          lastUpdated: Date.now(),
        },
        resetTime: this.getNextResetTime(),
      };
    }

    const currentDate = this.getCurrentDate();
    const dailyUsage = await this.getDailyUsage(userId, currentDate);
    const estimatedCost = this.calculateTokenCost(estimatedInputTokens, estimatedOutputTokens);
    const totalCostWithEstimate = dailyUsage.totalCost + estimatedCost;
    const remainingBudget = RATE_LIMIT_CONFIG.DAILY_SPENDING_LIMIT - dailyUsage.totalCost;
    const resetTime = this.getNextResetTime();

    const allowed = totalCostWithEstimate <= RATE_LIMIT_CONFIG.DAILY_SPENDING_LIMIT;

    return {
      allowed,
      remainingBudget: Math.max(0, remainingBudget),
      dailyUsage,
      resetTime,
      reason: !allowed ? 'Daily spending limit exceeded' : undefined,
    };
  }

  /**
   * Record actual token usage after a request
   */
  async recordUsage(usage: TokenUsage): Promise<void> {
    await this.connect();
    if (!this.isConnected) {
      console.warn('Redis not connected, skipping usage recording');
      return;
    }

    try {
      // Validate input
      const validatedUsage = TokenUsageSchema.parse(usage);
      const currentDate = this.getCurrentDate();
      const dailyUsage = await this.getDailyUsage(validatedUsage.userId, currentDate);
      
      // Update usage
      dailyUsage.totalInputTokens += validatedUsage.inputTokens;
      dailyUsage.totalOutputTokens += validatedUsage.outputTokens;
      dailyUsage.totalCost = this.calculateTokenCost(
        dailyUsage.totalInputTokens,
        dailyUsage.totalOutputTokens
      );
      dailyUsage.requestCount += 1;
      
      await this.updateDailyUsage(dailyUsage);
      
      console.log(`📊 Rate limit usage recorded for ${validatedUsage.userId}:`, {
        inputTokens: validatedUsage.inputTokens,
        outputTokens: validatedUsage.outputTokens,
        cost: this.calculateTokenCost(validatedUsage.inputTokens, validatedUsage.outputTokens),
        dailyTotal: dailyUsage.totalCost,
        remainingBudget: RATE_LIMIT_CONFIG.DAILY_SPENDING_LIMIT - dailyUsage.totalCost,
      });
    } catch (error) {
      console.error('Failed to record usage:', error);
    }
  }

  /**
   * Get current usage statistics for a user
   */
  async getUserUsage(userId: string): Promise<{
    currentDay: DailyUsage;
    remainingBudget: number;
    resetTime: number;
  }> {
    await this.connect();
    if (!this.isConnected) {
      return {
        currentDay: {
          userId,
          date: this.getCurrentDate(),
          totalInputTokens: 0,
          totalOutputTokens: 0,
          totalCost: 0,
          requestCount: 0,
          lastUpdated: Date.now(),
        },
        remainingBudget: RATE_LIMIT_CONFIG.DAILY_SPENDING_LIMIT,
        resetTime: this.getNextResetTime(),
      };
    }
    const currentDate = this.getCurrentDate();
    const dailyUsage = await this.getDailyUsage(userId, currentDate);
    const remainingBudget = RATE_LIMIT_CONFIG.DAILY_SPENDING_LIMIT - dailyUsage.totalCost;
    const resetTime = this.getNextResetTime();

    return {
      currentDay: dailyUsage,
      remainingBudget: Math.max(0, remainingBudget),
      resetTime,
    };
  }

  /**
   * Reset usage for a user (admin function)
   */
  async resetUserUsage(userId: string, date?: string): Promise<void> {
    await this.connect();
    if (!this.isConnected) {
      console.warn('Redis not connected, cannot reset usage');
      return;
    }

    const targetDate = date || this.getCurrentDate();
    const key = this.getDailyUsageKey(userId, targetDate);
    await this.redis.del(key);
    console.log(`🔄 Reset usage for user ${userId} on ${targetDate}`);
  }

  /**
   * Get usage statistics for all users (admin function)
   */
  async getAllUsersUsage(): Promise<Record<string, DailyUsage>> {
    await this.connect();
    if (!this.isConnected) {
      console.warn('Redis not connected, cannot get all users usage');
      return {};
    }

    const pattern = `${RATE_LIMIT_CONFIG.REDIS_KEY_PREFIX}${RATE_LIMIT_CONFIG.DAILY_USAGE_PREFIX}*`;
    const keys = await this.redis.keys(pattern);
    const usage: Record<string, DailyUsage> = {};

    for (const key of keys) {
      try {
        const cached = await this.redis.get(key);
        if (cached) {
          const dailyUsage = DailyUsageSchema.parse(JSON.parse(cached));
          usage[dailyUsage.userId] = dailyUsage;
        }
      } catch (error) {
        console.warn(`Failed to parse usage for key ${key}:`, error);
      }
    }

    return usage;
  }

  /**
   * Clean up old usage records (should be run periodically)
   */
  async cleanupOldRecords(daysToKeep: number = 7): Promise<number> {
    await this.connect();
    if (!this.isConnected) {
      console.warn('Redis not connected, cannot cleanup old records');
      return 0;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

    const pattern = `${RATE_LIMIT_CONFIG.REDIS_KEY_PREFIX}${RATE_LIMIT_CONFIG.DAILY_USAGE_PREFIX}*`;
    const keys = await this.redis.keys(pattern);
    let deletedCount = 0;

    for (const key of keys) {
      try {
        const cached = await this.redis.get(key);
        if (cached) {
          const dailyUsage = DailyUsageSchema.parse(JSON.parse(cached));
          if (dailyUsage.date < cutoffDateStr) {
            await this.redis.del(key);
            deletedCount++;
          }
        }
      } catch (error) {
        console.warn(`Failed to check usage for key ${key}:`, error);
      }
    }

    console.log(`🧹 Cleaned up ${deletedCount} old usage records`);
    return deletedCount;
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

// Export utility functions
export const calculateTokenCost = (inputTokens: number, outputTokens: number): number => {
  return (inputTokens / 1_000_000) * RATE_LIMIT_CONFIG.INPUT_TOKEN_COST_PER_MILLION +
         (outputTokens / 1_000_000) * RATE_LIMIT_CONFIG.OUTPUT_TOKEN_COST_PER_MILLION;
};

export const getDailySpendingLimit = (): number => RATE_LIMIT_CONFIG.DAILY_SPENDING_LIMIT;

// Graceful shutdown - only in production to avoid dev noise
if (process.env.NODE_ENV === 'production') {
  process.on('SIGINT', async () => {
    console.log('🔄 Shutting down rate limiter...');
    await rateLimiter.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('🔄 Shutting down rate limiter...');
    await rateLimiter.close();
    process.exit(0);
  });
}
