"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { store } from "@/redux/store";
import Image from "next/image";

export default function LandingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Check auth state from store
    const authState = store.getState().setAuthReducer.isAuthenticated;
    setIsAuthenticated(authState ?? false);
  }, []);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "How It Works", href: "#how-it-works" },
    // { name: "Pricing", href: "#pricing" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-white/95 backdrop-blur-sm shadow-md" : "bg-transparent"
      }`}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-md"
      >
        Skip to main content
      </a>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Image src="/logo.png" alt="WealthJourney" width={28} height={28} className="sm:w-8 sm:h-8" />
            <span className="text-base sm:text-lg md:text-xl font-semibold text-primary-600">WealthJourney</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-gray-700 hover:text-primary-600 transition-colors duration-200 font-medium focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 rounded-md px-2 py-1"
              >
                {link.name}
              </a>
            ))}
            {isAuthenticated ? (
              <Link
                href="/dashboard/home"
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-500 transition-colors duration-200 font-medium focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
              >
                Dashboard
              </Link>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/auth/login"
                  className="text-gray-700 hover:text-primary-600 transition-colors duration-200 font-medium focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 rounded-md px-2 py-1"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-500 transition-colors duration-200 font-medium focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px]"
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            <svg
              className="w-6 h-6 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-3 sm:py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-2 sm:space-y-3">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-gray-700 hover:text-primary-600 transition-colors duration-200 font-medium px-2 py-1 focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              {isAuthenticated ? (
                <Link
                  href="/dashboard/home"
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-500 transition-colors duration-200 font-medium text-center focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="text-gray-700 hover:text-primary-600 transition-colors duration-200 font-medium px-2 py-1 focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-500 transition-colors duration-200 font-medium text-center focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
