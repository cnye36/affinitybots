import { useState, useEffect, useCallback } from 'react';
import { DailyUsage } from '@/lib/rateLimiting';

interface RateLimitUsage {
  currentDay: DailyUsage;
  remainingBudget: number;
  resetTime: number;
}

interface UseRateLimitOptions {
  userId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

export function useRateLimit({
  userId,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
}: UseRateLimitOptions = {}) {
  const [usage, setUsage] = useState<RateLimitUsage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = useCallback(async () => {
    if (!userId) {
      setUsage(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/rate-limit?userId=${encodeURIComponent(userId)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch usage: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setUsage(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch usage');
      }
    } catch (err) {
      console.error('Rate limit usage fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Initial fetch
  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !userId) return;

    const interval = setInterval(fetchUsage, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, userId, refreshInterval, fetchUsage]);

  // Check if user is approaching or has exceeded limit
  const isNearLimit = usage ? usage.remainingBudget < 0.50 : false; // Less than $0.50 remaining
  const isExceeded = usage ? usage.remainingBudget <= 0 : false;
  // Calculate usage percentage, ensuring it's 0 when there's no actual usage
  const usagePercentage = usage && usage.currentDay.totalCost > 0 
    ? Math.max(0, Math.min(100, (usage.currentDay.totalCost / 2.00) * 100)) 
    : 0; // 2.00 is daily limit, clamp between 0-100

  // Format remaining budget for display (hidden from user)
  const formatRemainingBudget = (budget: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(budget);
  };

  // Format reset time for display in PST
  const formatResetTime = (timestamp: number) => {
    const resetDate = new Date(timestamp);
    const now = new Date();
    const diffMs = resetDate.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      return `${diffMinutes}m`;
    }
  };

  return {
    usage,
    loading,
    error,
    isNearLimit,
    isExceeded,
    usagePercentage,
    formatRemainingBudget,
    formatResetTime,
    refetch: fetchUsage,
  };
}

// Hook for checking rate limit before making requests
export function useRateLimitCheck() {
  const [checking, setChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<{
    allowed: boolean;
    remainingBudget: number;
    resetTime: number;
    reason?: string;
  } | null>(null);

  const checkRateLimit = useCallback(async (
    userId: string,
    estimatedInputTokens: number = 0,
    estimatedOutputTokens: number = 0
  ) => {
    setChecking(true);

    try {
      const response = await fetch('/api/rate-limit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          inputTokens: estimatedInputTokens,
          outputTokens: estimatedOutputTokens,
        }),
      });

      if (!response.ok) {
        throw new Error(`Rate limit check failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setLastCheck(result.data);
        return result.data;
      } else {
        throw new Error(result.error || 'Rate limit check failed');
      }
    } catch (error) {
      console.error('Rate limit check error:', error);
      throw error;
    } finally {
      setChecking(false);
    }
  }, []);

  return {
    checking,
    lastCheck,
    checkRateLimit,
  };
}
