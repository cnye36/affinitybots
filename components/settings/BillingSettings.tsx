"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Calendar, CheckCircle, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Subscription {
  plan_type: "free" | "starter" | "pro";
  status: "trialing" | "active" | "past_due" | "canceled" | "unpaid";
  trial_end: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

const PLAN_NAMES: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
};

const PLAN_DESCRIPTIONS: Record<string, string> = {
  free: "14-day free trial",
  starter: "$19.99/month after trial",
  pro: "$39.99/month after trial",
};

export function BillingSettings() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const response = await fetch("/api/subscriptions/current");
        if (response.ok) {
          const data = await response.json();
          setSubscription(data);
        }
      } catch (error) {
        console.error("Failed to fetch subscription:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSubscription();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Billing & Subscription</CardTitle>
          <CardDescription>Loading subscription information...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const planName = subscription ? PLAN_NAMES[subscription.plan_type] || "Free" : "Free";
  const planDescription = subscription
    ? PLAN_DESCRIPTIONS[subscription.plan_type] || "Basic features included"
    : "Basic features included";

  const isTrialing = subscription?.status === "trialing";
  const isActive = subscription?.status === "active";
  const isCanceled = subscription?.status === "canceled" || subscription?.cancel_at_period_end;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing & Subscription</CardTitle>
        <CardDescription>
          Manage your subscription and billing information.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border p-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-2xl font-bold">{planName}</h3>
                {isTrialing && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Trial
                  </Badge>
                )}
                {isActive && !isCanceled && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Active
                  </Badge>
                )}
                {isCanceled && (
                  <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                    Canceling
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {planDescription}
              </p>
              {subscription && (
                <div className="space-y-1 text-xs text-muted-foreground">
                  {isTrialing && subscription.trial_end && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Trial ends: {formatDate(subscription.trial_end)}</span>
                    </div>
                  )}
                  {isActive && subscription.current_period_end && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {isCanceled
                          ? `Access until: ${formatDate(subscription.current_period_end)}`
                          : `Renews: ${formatDate(subscription.current_period_end)}`}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
            {(!subscription || subscription.plan_type === "free") && (
              <Link href="/pricing">
                <Button>Upgrade Plan</Button>
              </Link>
            )}
          </div>
        </div>

        {subscription && subscription.plan_type !== "free" && (
          <>
            <div className="rounded-lg border p-4">
              <h3 className="font-medium mb-4">Payment Method</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Payment methods are managed through Stripe. Visit your Stripe customer portal to update your payment method.
              </p>
              <Button variant="outline" className="w-full" asChild>
                <a
                  href="/api/subscriptions/portal"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Manage Payment Method
                </a>
              </Button>
            </div>

            <div className="rounded-lg border p-4">
              <h3 className="font-medium mb-2">Subscription Management</h3>
              {isCanceled ? (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Subscription Canceling
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                      Your subscription will remain active until the end of your current billing period.
                    </p>
                  </div>
                </div>
              ) : (
                <Button variant="outline" className="w-full" asChild>
                  <a
                    href="/api/subscriptions/portal"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Manage Subscription
                  </a>
                </Button>
              )}
            </div>
          </>
        )}

        <div className="rounded-lg border p-4">
          <h3 className="font-medium mb-2">Billing History</h3>
          <p className="text-sm text-muted-foreground">
            {subscription && subscription.plan_type !== "free"
              ? "View your billing history in the Stripe customer portal."
              : "No billing history available"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
