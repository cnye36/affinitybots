"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const plan = searchParams.get("plan");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!plan) {
      setError("No plan specified");
      return;
    }

    const initiateCheckout = async () => {
      try {
        const response = await fetch("/api/subscriptions/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ plan }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to create checkout session");
        }

        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error("No checkout URL returned");
        }
      } catch (err) {
        console.error("Checkout error:", err);
        setError(err instanceof Error ? err.message : "Failed to initiate checkout");
      }
    };

    initiateCheckout();
  }, [plan]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="text-destructive mb-4">Error: {error}</div>
        <button 
          onClick={() => router.push("/pricing")}
          className="text-primary hover:underline"
        >
          Return to Pricing
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground">Preparing your checkout...</p>
    </div>
  );
}
