"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Menu, X, ChevronDown } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


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
        scrolled ? "py-2" : "py-4"
      }`}
    >
      <div className="container mx-auto px-4 flex justify-between items-center h-full">
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
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 text-md font-medium hover:text-primary outline-none">
              Features
              <ChevronDown className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/integrations" className="cursor-pointer">
                  Integrations
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/features/ai-agents" className="cursor-pointer">
                  AI Agents
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/features/workflows" className="cursor-pointer">
                  Workflows
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/features/knowledge" className="cursor-pointer">
                  Knowledge & Memory
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/features/playground" className="cursor-pointer">
                  Playground
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 text-md font-medium hover:text-primary outline-none">
              Resources
              <ChevronDown className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/use-cases" className="cursor-pointer">
                  Use Cases
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/docs" className="cursor-pointer">
                  Docs
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/blog" className="cursor-pointer">
                  Blog
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link
            href="/pricing"
            className="text-md font-medium hover:text-primary"
          >
            Pricing
          </Link>
          <Link
            href="/contact"
            className="text-md font-medium hover:text-primary"
          >
            Contact
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          <Link href="/pricing" className="hidden md:block">
            <Button
              variant="default"
              className={`transition-all duration-200 ${
                scrolled ? "text-sm py-1" : ""
              }`}
            >
              Get Started
            </Button>
          </Link>

          <Link href="/auth/signin" className="hidden md:block">
            <div className="relative p-0.5 rounded-md bg-gradient-to-r from-blue-500 to-purple-600">
              <Button
                variant="ghost"
                className={`transition-all duration-200 bg-background hover:bg-background/80 ${
                  scrolled ? "text-sm py-1" : ""
                }`}
              >
                Sign In
              </Button>
            </div>
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
              <div className="py-2">
                <div className="text-md font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Features
                </div>
                <div className="pl-4 space-y-2">
                  <Link
                    href="/integrations"
                    className="block text-sm text-gray-600 dark:text-gray-400 hover:text-primary py-1"
                    onClick={handleNavClick}
                  >
                    Integrations
                  </Link>
                  <Link
                    href="/features/ai-agents"
                    className="block text-sm text-gray-600 dark:text-gray-400 hover:text-primary py-1"
                    onClick={handleNavClick}
                  >
                    AI Agents
                  </Link>
                  <Link
                    href="/features/workflows"
                    className="block text-sm text-gray-600 dark:text-gray-400 hover:text-primary py-1"
                    onClick={handleNavClick}
                  >
                    Workflows
                  </Link>
                  <Link
                    href="/features/knowledge"
                    className="block text-sm text-gray-600 dark:text-gray-400 hover:text-primary py-1"
                    onClick={handleNavClick}
                  >
                    Knowledge & Memory
                  </Link>
                  <Link
                    href="/features/playground"
                    className="block text-sm text-gray-600 dark:text-gray-400 hover:text-primary py-1"
                    onClick={handleNavClick}
                  >
                    Playground
                  </Link>
                </div>
              </div>

              <div className="py-2">
                <div className="text-md font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Resources
                </div>
                <div className="pl-4 space-y-2">
                  <Link
                    href="/use-cases"
                    className="block text-sm text-gray-600 dark:text-gray-400 hover:text-primary py-1"
                    onClick={handleNavClick}
                  >
                    Use Cases
                  </Link>
                  <Link
                    href="/docs"
                    className="block text-sm text-gray-600 dark:text-gray-400 hover:text-primary py-1"
                    onClick={handleNavClick}
                  >
                    Docs
                  </Link>
                  <Link
                    href="/blog"
                    className="block text-sm text-gray-600 dark:text-gray-400 hover:text-primary py-1"
                    onClick={handleNavClick}
                  >
                    Blog
                  </Link>
                </div>
              </div>

              <Link
                href="/pricing"
                className="text-md font-medium hover:text-primary py-2"
                onClick={handleNavClick}
              >
                Pricing
              </Link>
              <Link
                href="/contact"
                className="text-md font-medium hover:text-primary py-2"
                onClick={handleNavClick}
              >
                Contact
              </Link>
              <Link
                href="/pricing"
                className="mt-2"
                onClick={handleNavClick}
              >
                <Button variant="default" className="w-full">
                  Get Started
                </Button>
              </Link>

              <Link href="/auth/signin" onClick={handleNavClick}>
                <div className="relative p-0.5 rounded-md bg-gradient-to-r from-blue-500 to-purple-600 w-full">
                  <Button variant="ghost" className="w-full bg-background hover:bg-background/80">
                    Sign In
                  </Button>
                </div>
              </Link>
            </nav>
          </div>
        )}
    </header>
  );
}
