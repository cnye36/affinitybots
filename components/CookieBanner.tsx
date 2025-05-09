"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "./ui/button";
import { X } from "lucide-react";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const cookieConsent = localStorage.getItem("cookie-consent");
    if (!cookieConsent) {
      // Show banner if no choice has been made
      setVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
  };

  const declineCookies = () => {
    localStorage.setItem("cookie-consent", "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t border-border shadow-lg">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-medium mb-1">We value your privacy</h3>
            <p className="text-sm text-muted-foreground">
              We use cookies to enhance your browsing experience, serve
              personalized content, and analyze our traffic. By clicking
              &ldquo;Accept All&rdquo;, you consent to our use of cookies. Read
              our{" "}
              <Link
                href="/cookie"
                className="underline text-primary hover:text-primary/80"
              >
                Cookie Policy
              </Link>{" "}
              to learn more.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={declineCookies}>
              Decline
            </Button>
            <Button size="sm" onClick={acceptCookies}>
              Accept All
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-8 w-8"
              onClick={declineCookies}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
