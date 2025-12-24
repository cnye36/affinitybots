"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useState } from "react";

interface CheckoutButtonProps {
  planId: "starter" | "pro";
  cta: string;
  popular?: boolean;
}

export function CheckoutButton({ planId, cta, popular = false }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan: planId }),
      });

      const data = await response.json();

      if (response.status === 401) {
        window.location.href = `/auth/signup?plan=${planId}`;
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert(error instanceof Error ? error.message : "Failed to start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCheckout}
      disabled={loading}
      className={`w-full ${
        popular
          ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          : "bg-blue-600 hover:bg-blue-700"
      }`}
    >
      {loading ? "Loading..." : cta}
      {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
    </Button>
  );
}

