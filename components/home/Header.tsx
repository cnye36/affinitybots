"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Menu, X } from "lucide-react";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(true);

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

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Close mobile menu when clicking a navigation link
  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border transition-all duration-200 ${
        scrolled ? "py-2" : "py-4 md:py-6"
      }`}
    >
      {showAnnouncement && (
        <div className="w-full bg-primary/10 text-primary relative">
          <div className="container mx-auto px-4 pr-8 py-1 text-center text-xs md:text-sm whitespace-nowrap overflow-hidden text-ellipsis">
            <span className="font-semibold">AgentHub is now AffinityBots</span>
            <span className="mx-2 opacity-60">•</span>
            <span>Same Awesome Agents, New Name</span>
          </div>
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-primary/15 focus:outline-none focus:ring-2 focus:ring-primary/40"
            onClick={() => setShowAnnouncement(false)}
            aria-label="Dismiss announcement"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <Image
            src="/images/AffinityBots-Icon-Dark-250px.png"
            alt="AffinityBots Logo"
            width={96}
            height={96}
            className={`transition-all duration-200 ${
              scrolled
                ? "w-10 h-10 md:w-12 md:h-12"
                : "w-12 h-12 md:w-16 md:h-16"
            } mr-2`}
          />

          <span
            className={`font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-200 ${
              scrolled ? "text-lg md:text-xl" : "text-xl md:text-2xl"
            }`}
          >
            AffinityBots
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link
            href="/#features"
            className="text-md font-medium hover:text-primary"
          >
            Features
          </Link>
          <Link
            href="/#how-it-works"
            className="text-md font-medium hover:text-primary"
          >
            How It Works
          </Link>
          <Link
            href="/#benefits"
            className="text-md font-medium hover:text-primary"
          >
            Benefits
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          <Link href="/early-access" className="hidden md:block">
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

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

              {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-background shadow-lg border-b border-border">
            <nav className="container mx-auto px-4 py-4 flex flex-col space-y-4">
              <Link
                href="/#features"
                className="text-md font-medium hover:text-primary py-2"
                onClick={handleNavClick}
              >
                Features
              </Link>
              <Link
                href="/#how-it-works"
                className="text-md font-medium hover:text-primary py-2"
                onClick={handleNavClick}
              >
                How It Works
              </Link>
              <Link
                href="/#benefits"
                className="text-md font-medium hover:text-primary py-2"
                onClick={handleNavClick}
              >
                Benefits
              </Link>
              <Link
                href="/early-access"
                className="mt-2"
                onClick={handleNavClick}
              >
                <Button variant="default" className="w-full">
                  Request Access
                </Button>
              </Link>
            </nav>
          </div>
        )}
    </header>
  );
}
