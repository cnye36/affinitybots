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
          width={125}
          height={125}
          className="w-10 h-10 mr-2"
        />
        <span className="text-xl font-bold">AgentHub</span>
      </Link>
      <div className="flex items-center space-x-4">
        <Link href="/signin">
          <Button variant="ghost">Sign In</Button>
        </Link>
        <Link href="/signup">
          <Button>Sign Up</Button>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
