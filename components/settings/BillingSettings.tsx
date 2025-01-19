"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreditCard } from "lucide-react";

interface BillingSettingsProps {
  currentPlan?: {
    name: string;
    description: string;
  };
}

export function BillingSettings({
  currentPlan = { name: "Free Plan", description: "Basic features included" },
}: BillingSettingsProps) {
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
          <h3 className="font-medium mb-2">Current Plan</h3>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-2xl font-bold">{currentPlan.name}</p>
              <p className="text-sm text-muted-foreground">
                {currentPlan.description}
              </p>
            </div>
            <Button variant="outline">Upgrade Plan</Button>
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="font-medium mb-4">Payment Method</h3>
          <Button variant="outline" className="w-full">
            <CreditCard className="mr-2 h-4 w-4" />
            Add Payment Method
          </Button>
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="font-medium mb-2">Usage & Billing History</h3>
          <p className="text-sm text-muted-foreground">
            No billing history available
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
