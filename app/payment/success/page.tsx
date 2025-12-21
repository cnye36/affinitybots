"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/home/Header";
import { Footer } from "@/components/home/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default function PaymentSuccessPage() {
  const router = useRouter();

  // Auto-redirect to dashboard after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/dashboard");
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 pt-32 pb-16">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-3xl">Welcome to AffinityBots!</CardTitle>
              <CardDescription className="text-lg">
                Your subscription is now active. Enjoy your 14-day free trial with full Pro access!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">What's Next?</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Your 14-day free trial has started with full Pro-level access</li>
                  <li>• You'll have access to all Pro features: 50 agents, unlimited workflows, 25,000 credits/day</li>
                  <li>• After 14 days, you'll be automatically charged for your selected plan</li>
                  <li>• If you chose Starter, limits will apply after trial. If Pro, you keep Pro limits</li>
                  <li>• You can cancel anytime from your account settings before trial ends</li>
                </ul>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/dashboard" className="flex-1">
                  <Button className="w-full">Go to Dashboard</Button>
                </Link>
                <Link href="/settings?tab=billing" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Manage Subscription
                  </Button>
                </Link>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Redirecting to dashboard in a few seconds...
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}

