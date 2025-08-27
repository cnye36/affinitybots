'use client';

import React, { useState, useEffect } from 'react';
import { useRateLimit } from '@/hooks/useRateLimit';
import { AlertCircle, Zap } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface RateLimitProgressProps {
  userId?: string;
  className?: string;
}

export function RateLimitProgress({ userId, className = '' }: RateLimitProgressProps) {
  const {
    usage,
    loading,
    isExceeded,
    usagePercentage,
    formatResetTime,
  } = useRateLimit({ userId, autoRefresh: false });

  // Debug logging to help identify issues
  useEffect(() => {
    if (usage && userId) {
      console.log(`RateLimitProgress Debug - User: ${userId}`, {
        totalCost: usage.currentDay.totalCost,
        usagePercentage,
        remainingBudget: usage.remainingBudget,
        requestCount: usage.currentDay.requestCount,
        totalInputTokens: usage.currentDay.totalInputTokens,
        totalOutputTokens: usage.currentDay.totalOutputTokens,
        progressWidth: getProgressWidth(),
        willRenderProgress: getProgressWidth() > 0,
      });
    }
  }, [usage, usagePercentage, userId]);

  const [showOutOfCreditsDialog, setShowOutOfCreditsDialog] = useState(false);

  // Show dialog when user runs out of credits
  useEffect(() => {
    if (isExceeded && usage) {
      setShowOutOfCreditsDialog(true);
    }
  }, [isExceeded, usage]);

  if (!userId || loading) {
    return null;
  }

  const getProgressColor = () => {
    if (isExceeded) return 'bg-red-500';
    if (usagePercentage > 80) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const getProgressWidth = () => {
    // Ensure we don't show any progress when there's no usage
    if (!usage || usage.currentDay.totalCost === 0) {
      console.log('getProgressWidth: No usage detected, returning 0');
      return 0;
    }
    const width = Math.min(usagePercentage, 100);
    console.log('getProgressWidth: Usage detected, returning width:', width);
    return width;
  };

  return (
    <>
      {/* Progress bar */}
      <div className={`flex flex-col space-y-1 ${className}`}>
        <p className="text-sm text-muted-foreground">Daily Credits</p>
        <div className="flex items-center space-x-2">
          <Zap className="h-3 w-3 text-muted-foreground" />
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            {getProgressWidth() > 0 ? (
              <div
                className={`h-full rounded-full transition-all duration-300 ${getProgressColor()}`}
                style={{ width: `${getProgressWidth()}%` }}
                data-width={getProgressWidth()}
                data-usage-percentage={usagePercentage}
                data-total-cost={usage?.currentDay.totalCost}
              />
            ) : null}
          </div>
        </div>
      </div>

      {/* Out of credits dialog */}
      <Dialog open={showOutOfCreditsDialog} onOpenChange={setShowOutOfCreditsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span>Out of Credits</span>
            </DialogTitle>
            <DialogDescription>
              You've used all your daily credits. Here are your options:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Wait for Reset
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Your credits will reset in {usage ? formatResetTime(usage.resetTime) : '24 hours'} (PST).
              </p>
            </div>
            
            <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
              <h4 className="font-medium text-green-900 dark:text-green-100 mb-1">
                Use Your Own API Key
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300">
                Add your own OpenAI API key in Settings to get unlimited usage with your own billing.
              </p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowOutOfCreditsDialog(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setShowOutOfCreditsDialog(false);
                window.location.href = '/settings?tab=api-keys';
              }}
            >
              Go to Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
