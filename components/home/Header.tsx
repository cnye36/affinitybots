import React from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export function Header() {
  return (
    <header className="container mx-auto px-4 py-6 flex justify-between items-center">
      <Link href="/" className="flex items-center">
        <Image
          src="/logo.png"
          alt="AgentHub Logo"
          width={256}
          height={256}
          className="w-10 h-10 mr-2"
        />
        <span className="text-xl font-bold">AgentHub</span>
      </Link>

      <nav className="hidden md:flex items-center space-x-6">
        <a href="#features" className="text-sm font-medium hover:text-primary">
          Features
        </a>
        <a
          href="#how-it-works"
          className="text-sm font-medium hover:text-primary"
        >
          How It Works
        </a>
        <a href="#benefits" className="text-sm font-medium hover:text-primary">
          Benefits
        </a>
        <a href="#pricing" className="text-sm font-medium hover:text-primary">
          Pricing
        </a>
      </nav>

      <div className="flex items-center space-x-4">
        <Link href="/early-access">
          <Button variant="default">Request Access</Button>
        </Link>

        <ThemeToggle />
      </div>
    </header>
  );
}
