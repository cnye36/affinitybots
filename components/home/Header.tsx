"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [scrolled]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border transition-all duration-200 ${
        scrolled ? "py-2" : "py-6"
      }`}
    >
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="AgentHub Logo"
            width={48}
            height={75}
            className={`transition-all duration-200 ${
              scrolled ? "w-12 h-12" : "w-16 h-16"
            } mr-2`}
          />

          <span
            className={`font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-200 ${
              scrolled ? "text-xl" : "text-2xl"
            }`}
          >
            AgentHub
          </span>
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          <a
            href="#features"
            className="text-md font-medium hover:text-primary"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-md font-medium hover:text-primary"
          >
            How It Works
          </a>
          <a
            href="#benefits"
            className="text-md font-medium hover:text-primary"
          >
            Benefits
          </a>
        </nav>

        <div className="flex items-center space-x-4">
          <Link href="/early-access">
            <Button
              variant="default"
              className={`transition-all duration-200 ${
                scrolled ? "text-sm py-1" : ""
              }`}
            >
              Request Access
            </Button>
          </Link>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
