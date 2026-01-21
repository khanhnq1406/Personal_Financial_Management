# Landing Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a modern, financial-style landing page for WealthJourney that introduces the application's features and value propositions to potential users.

**Architecture:** A Next.js 15 App Router landing page at `/` (root) using existing design system (Tailwind CSS, BaseCard components), with responsive layout, accessibility compliance, and smooth animations.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS 3.4, Framer Motion (for animations)

---

## Pre-Implementation Checklist

### Verify Prerequisites

**Step 1: Verify existing pages structure**

Run: `ls -la src/wj-client/app/`

Expected output: Shows existing pages including `page.tsx`, `auth/`, `dashboard/` directories

**Step 2: Check current root page**

Read: `src/wj-client/app/page.tsx`

Expected: Current homepage implementation (likely redirects to dashboard or login)

**Step 3: Verify design system colors**

Read: `src/wj-client/tailwind.config.ts`

Expected: Contains brand colors (bg: #008148, fg: #F7F8FC, etc.)

**Step 4: Install animation library if not present**

Run: `cd src/wj-client && npm list framer-motion 2>/dev/null | grep framer-motion || echo "Not installed"`

Expected: Either version number or "Not installed"

- If not installed: `npm install framer-motion`

---

## Task 1: Create Landing Page Route Structure

**Files:**

- Create: `src/wj-client/app/landing/page.tsx`

**Step 1: Create landing page directory and basic page component**

Create: `src/wj-client/app/landing/page.tsx`

```typescript
"use client";

import { Metadata } from "next";
import LandingHero from "@/components/landing/LandingHero";
import LandingFeatures from "@/components/landing/LandingFeatures";
import LandingHowItWorks from "@/components/landing/LandingHowItWorks";
import LandingCTA from "@/components/landing/LandingCTA";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-fg">
      <LandingNavbar />
      <main>
        <LandingHero />
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingCTA />
      </main>
      <LandingFooter />
    </div>
  );
}

export const metadata: Metadata = {
  title: "WealthJourney - Your Trusted Guide to Financial Freedom",
  description: "Track expenses, manage multiple wallets, set budgets, and visualize your financial journey with WealthJourney.",
};
```

**Step 2: Verify file created**

Run: `ls -la src/wj-client/app/landing/`

Expected: Shows `page.tsx` file


---

## Task 2: Create Landing Navbar Component

**Files:**

- Create: `src/wj-client/components/landing/LandingNavbar.tsx`

**Step 1: Write the navbar component**

Create: `src/wj-client/components/landing/LandingNavbar.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppSelector } from "@/redux/reducer";
import Image from "next/image";

export default function LandingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Pricing", href: "#pricing" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-white/95 backdrop-blur-sm shadow-md" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Image src="/logo.png" alt="WealthJourney" width={32} height={32} />
            <span className="text-xl font-semibold text-bg">WealthJourney</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-gray-700 hover:text-bg transition-colors duration-200 font-medium"
              >
                {link.name}
              </a>
            ))}
            {isAuthenticated ? (
              <Link
                href="/dashboard/home"
                className="px-4 py-2 bg-bg text-white rounded-md hover:bg-bg/90 transition-colors duration-200 font-medium"
              >
                Dashboard
              </Link>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/auth/login"
                  className="text-gray-700 hover:text-bg transition-colors duration-200 font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 bg-bg text-white rounded-md hover:bg-bg/90 transition-colors duration-200 font-medium"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="sm:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-gray-700 hover:text-bg transition-colors duration-200 font-medium px-2 py-1"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              {isAuthenticated ? (
                <Link
                  href="/dashboard/home"
                  className="px-4 py-2 bg-bg text-white rounded-md hover:bg-bg/90 transition-colors duration-200 font-medium text-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="text-gray-700 hover:text-bg transition-colors duration-200 font-medium px-2 py-1"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    className="px-4 py-2 bg-bg text-white rounded-md hover:bg-bg/90 transition-colors duration-200 font-medium text-center"
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
```

**Step 2: Run TypeScript check**

Run: `cd src/wj-client && npx tsc --noEmit --pretty 2>&1 | grep -A5 "LandingNavbar" || echo "No errors in LandingNavbar"`

Expected: No TypeScript errors


---

## Task 3: Create Hero Section Component

**Files:**

- Create: `src/wj-client/components/landing/LandingHero.tsx`

**Step 1: Write the hero section component**

Create: `src/wj-client/components/landing/LandingHero.tsx`

```typescript
"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function LandingHero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-32 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-bg/5 via-transparent to-bg/10" aria-hidden="true" />

      <motion.div
        className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="text-center">
          <motion.div variants={itemVariants}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 text-wrap-balance">
              Your Trusted Guide to{" "}
              <span className="text-bg">Financial Freedom</span>
            </h1>
          </motion.div>

          <motion.p
            variants={itemVariants}
            className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto text-wrap-pretty"
          >
            Track expenses, manage multiple wallets, set budgets, and visualize your
            complete financial journey in one powerful platform.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/auth/register"
              className="w-full sm:w-auto px-8 py-3 bg-bg text-white rounded-md hover:bg-hgreen transition-colors duration-200 font-medium text-center focus-visible:ring-2 focus-visible:ring-bg focus-visible:ring-offset-2"
            >
              Get Started for Free
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto px-8 py-3 border-2 border-bg text-bg rounded-md hover:bg-bg hover:text-white transition-colors duration-200 font-medium text-center focus-visible:ring-2 focus-visible:ring-bg focus-visible:ring-offset-2"
            >
              Explore Features
            </a>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500"
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-bg" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-bg" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Secure with OAuth</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-bg" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Free forever plan</span>
            </div>
          </motion.div>
        </div>

        {/* Dashboard Preview Image */}
        <motion.div
          variants={itemVariants}
          className="mt-16 relative"
        >
          <div className="relative rounded-lg shadow-2xl overflow-hidden bg-white p-2">
            <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded flex items-center justify-center">
              <p className="text-gray-400 text-lg">Dashboard Preview</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
```

**Step 2: Run TypeScript check**

Run: `cd src/wj-client && npx tsc --noEmit --pretty 2>&1 | grep -A5 "LandingHero" || echo "No errors in LandingHero"`

Expected: No TypeScript errors


---

## Task 4: Create Features Section Component

**Files:**

- Create: `src/wj-client/components/landing/LandingFeatures.tsx`

**Step 1: Write the features section component**

Create: `src/wj-client/components/landing/LandingFeatures.tsx`

```typescript
"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

const features = [
  {
    name: "Multiple Wallets",
    description: "Manage BASIC and INVESTMENT wallets. Transfer funds easily between accounts.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    name: "Transaction Tracking",
    description: "Categorize income and expenses. Filter, sort, and search your transaction history.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    name: "Visual Analytics",
    description: "Beautiful charts showing balance history, income vs expenses, and wallet distribution.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    name: "Budget Planning",
    description: "Set budgets with visual progress indicators. Track spending and stay on target.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
      </svg>
    ),
  },
  {
    name: "Financial Reports",
    description: "Monthly breakdowns per wallet with running balances. Export to CSV for analysis.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    name: "Secure Authentication",
    description: "Sign up with Google OAuth. JWT tokens with Redis whitelist for maximum security.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
];

export default function LandingFeatures() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 text-wrap-balance">
            Everything You Need to Manage Your Finances
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto text-wrap-pretty">
            Powerful tools designed to help you track, analyze, and optimize your
            financial life.
          </p>
        </motion.div>

        <motion.div
          ref={ref}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {features.map((feature) => (
            <motion.div
              key={feature.name}
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className="p-6 bg-fg rounded-lg hover:shadow-lg transition-shadow duration-200"
            >
              <div className="w-14 h-14 bg-bg/10 rounded-lg flex items-center justify-center text-bg mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.name}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
```

**Step 2: Run TypeScript check**

Run: `cd src/wj-client && npx tsc --noEmit --pretty 2>&1 | grep -A5 "LandingFeatures" || echo "No errors in LandingFeatures"`

Expected: No TypeScript errors


---

## Task 5: Create How It Works Section Component

**Files:**

- Create: `src/wj-client/components/landing/LandingHowItWorks.tsx`

**Step 1: Write the how it works section component**

Create: `src/wj-client/components/landing/LandingHowItWorks.tsx`

```typescript
"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

const steps = [
  {
    number: "01",
    name: "Sign Up with Google",
    description: "Create your account securely using Google OAuth. No passwords to remember.",
  },
  {
    number: "02",
    name: "Create Your First Wallet",
    description: "Set up BASIC or INVESTMENT wallets. Add your initial balance.",
  },
  {
    number: "03",
    name: "Start Tracking Transactions",
    description: "Add income and expenses with custom categories for better organization.",
  },
  {
    number: "04",
    name: "Gain Financial Insights",
    description: "View charts, reports, and analytics to understand your spending patterns.",
  },
];

export default function LandingHowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <section id="how-it-works" className="py-20 bg-fg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 text-wrap-balance">
            Get Started in Minutes
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto text-wrap-pretty">
            Simple setup process to start managing your finances today.
          </p>
        </motion.div>

        <motion.div
          ref={ref}
          className="space-y-8 max-w-3xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              variants={itemVariants}
              className="flex items-start gap-6"
            >
              <div className="flex-shrink-0 w-16 h-16 bg-bg text-white rounded-full flex items-center justify-center text-xl font-bold">
                {step.number}
              </div>
              <div className="flex-1 pt-2">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {step.name}
                </h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden sm:block absolute left-8 mt-16 w-0.5 h-16 bg-bg/20" />
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
```

**Step 2: Run TypeScript check**

Run: `cd src/wj-client && npx tsc --noEmit --pretty 2>&1 | grep -A5 "LandingHowItWorks" || echo "No errors in LandingHowItWorks"`

Expected: No TypeScript errors


---

## Task 6: Create CTA Section Component

**Files:**

- Create: `src/wj-client/components/landing/LandingCTA.tsx`

**Step 1: Write the CTA section component**

Create: `src/wj-client/components/landing/LandingCTA.tsx`

```typescript
"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";

export default function LandingCTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <section className="py-20 bg-bg">
      <motion.div
        ref={ref}
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 text-wrap-balance">
          Ready to Take Control of Your Finances?
        </h2>
        <p className="text-lg text-green-100 mb-10 max-w-2xl mx-auto text-wrap-pretty">
          Join thousands of users who are already tracking their financial journey
          with WealthJourney. Start for free today.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/auth/register"
            className="w-full sm:w-auto px-8 py-4 bg-white text-bg rounded-md hover:bg-gray-100 transition-colors duration-200 font-semibold text-center focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Get Started for Free
          </Link>
          <Link
            href="/auth/login"
            className="w-full sm:w-auto px-8 py-4 border-2 border-white text-white rounded-md hover:bg-white/10 transition-colors duration-200 font-semibold text-center focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Sign In
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
```

**Step 2: Run TypeScript check**

Run: `cd src/wj-client && npx tsc --noEmit --pretty 2>&1 | grep -A5 "LandingCTA" || echo "No errors in LandingCTA"`

Expected: No TypeScript errors


---

## Task 7: Create Footer Component

**Files:**

- Create: `src/wj-client/components/landing/LandingFooter.tsx`

**Step 1: Write the footer component**

Create: `src/wj-client/components/landing/LandingFooter.tsx`

```typescript
"use client";

import Link from "next/link";

export default function LandingFooter() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: "Features", href: "#features" },
      { name: "Pricing", href: "#pricing" },
      { name: "Security", href: "#security" },
    ],
    company: [
      { name: "About", href: "#about" },
      { name: "Blog", href: "#blog" },
      { name: "Careers", href: "#careers" },
    ],
    legal: [
      { name: "Privacy", href: "#privacy" },
      { name: "Terms", href: "#terms" },
      { name: "Cookie Policy", href: "#cookies" },
    ],
  };

  return (
    <footer className="bg-gray-900 text-gray-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <span className="text-xl font-semibold text-white">WealthJourney</span>
            </Link>
            <p className="text-sm mb-4">
              Your trusted guide to financial freedom.
            </p>
            <div className="flex items-center space-x-4 text-sm">
              <span>Built with</span>
              <span className="text-white">Next.js 15</span>
              <span>+</span>
              <span className="text-white">Go 1.23</span>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="hover:text-white transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="hover:text-white transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="hover:text-white transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center text-sm">
          <p>&copy; {currentYear} WealthJourney. All rights reserved.</p>
          <div className="flex items-center space-x-6 mt-4 sm:mt-0">
            <a href="#github" className="hover:text-white transition-colors">
              GitHub
            </a>
            <a href="#twitter" className="hover:text-white transition-colors">
              Twitter
            </a>
            <a href="#linkedin" className="hover:text-white transition-colors">
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
```

**Step 2: Run TypeScript check**

Run: `cd src/wj-client && npx tsc --noEmit --pretty 2>&1 | grep -A5 "LandingFooter" || echo "No errors in LandingFooter"`

Expected: No TypeScript errors


---

## Task 8: Update Tailwind Config for Landing Page

**Files:**

- Modify: `src/wj-client/tailwind.config.ts`

**Step 1: Add custom utilities for landing page**

Read: `src/wj-client/tailwind.config.ts`

Current file should contain the brand colors. Add these utilities if not present:

Modify: `src/wj-client/tailwind.config.ts`

Add to the `theme` section:

```typescript
theme: {
  extend: {
    // ... existing colors ...
    textColor: {
      bg: "#008148",
      fg: "#F7F8FC",
    },
  },
}
```

**Step 2: Run build to verify config**

Run: `cd src/wj-client && npm run build 2>&1 | tail -20`

Expected: Build succeeds with no errors


---

## Task 9: Update Root Page to Redirect or Show Landing

**Files:**

- Modify: `src/wj-client/app/page.tsx`

**Step 1: Update root page logic**

Read current: `src/wj-client/app/page.tsx`

Replace content with:

```typescript
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/redux/reducer";

export default function Home() {
  const router = useRouter();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard/home");
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return null; // Will redirect
  }

  // Show landing page for non-authenticated users
  router.push("/landing");
  return null;
}
```

**Step 2: Test navigation**

Run: `cd src/wj-client && npm run dev`

Visit: http://localhost:3000
Expected: Redirects to /landing (if not authenticated) or /dashboard/home (if authenticated)

**Step 3: Stop dev server and commit**

```bash
git add src/wj-client/app/page.tsx
git commit -m "feat: redirect root based on auth state"
```

---

## Task 10: Add Accessibility Features

**Files:**

- Modify: `src/wj-client/components/landing/LandingNavbar.tsx`
- Modify: `src/wj-client/components/landing/LandingHero.tsx`
- Modify: `src/wj-client/components/landing/LandingFeatures.tsx`

**Step 1: Add skip link to navbar**

Modify: `src/wj-client/components/landing/LandingNavbar.tsx`

Add after opening `<nav>` tag:

```typescript
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-bg focus:text-white focus:rounded-md"
>
  Skip to main content
</a>
```

**Step 2: Add scroll margin to sections**

Modify: `src/wj-client/components/landing/LandingFeatures.tsx`
Modify: `src/wj-client/components/landing/LandingHowItWorks.tsx`

Add to section className: `[scroll-margin-top:5rem]`

**Step 3: Ensure all interactive elements have focus states**

Verify all links and buttons have `focus-visible:ring-*` classes

**Step 4: Run accessibility audit**

Run: `cd src/wj-client && npx eslint . --ext .ts,.tsx 2>&1 | grep -i "accessibility\|aria" || echo "No accessibility issues found"`

Expected: No critical accessibility issues

---

## Task 11: Add Smooth Scrolling and Reduced Motion Support

**Files:**

- Modify: `src/wj-client/app/layout.tsx`

**Step 1: Add smooth scroll to global CSS**

Read: `src/wj-client/app/globals.css`

Add to the root:

```css
html {
  scroll-behavior: smooth;
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }

  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Step 2: Update motion components to respect reduced motion**

Create: `src/wj-client/components/landing/MotionContainer.tsx`

```typescript
"use client";

import { motion, MotionProps } from "framer-motion";
import { useEffect, useState } from "react";

interface MotionContainerProps extends MotionProps {
  children: React.ReactNode;
  className?: string;
}

export default function MotionContainer({
  children,
  className = "",
  ...props
}: MotionContainerProps) {
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setShouldReduceMotion(mediaQuery.matches);

    const handleChange = () => setShouldReduceMotion(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div className={className} {...props}>
      {children}
    </motion.div>
  );
}
```

---

## Task 12: Add Loading States and Error Boundaries

**Files:**

- Create: `src/wj-client/components/landing/LandingErrorBoundary.tsx`
- Create: `src/wj-client/components/landing/LandingLoading.tsx`

**Step 1: Create error boundary component**

Create: `src/wj-client/components/landing/LandingErrorBoundary.tsx`

```typescript
"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class LandingErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Landing page error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-fg">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Something went wrong
              </h1>
              <p className="text-gray-600 mb-6">
                We apologize for the inconvenience. Please try refreshing the page.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-bg text-white rounded-md hover:bg-hgreen transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
```

**Step 2: Wrap landing page with error boundary**

Modify: `src/wj-client/app/landing/page.tsx`

```typescript
"use client";

import { Metadata } from "next";
import LandingHero from "@/components/landing/LandingHero";
import LandingFeatures from "@/components/landing/LandingFeatures";
import LandingHowItWorks from "@/components/landing/LandingHowItWorks";
import LandingCTA from "@/components/landing/LandingCTA";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingErrorBoundary from "@/components/landing/LandingErrorBoundary";

export default function LandingPage() {
  return (
    <LandingErrorBoundary>
      <div className="min-h-screen bg-fg">
        <LandingNavbar />
        <main id="main-content">
          <LandingHero />
          <LandingFeatures />
          <LandingHowItWorks />
          <LandingCTA />
        </main>
        <LandingFooter />
      </div>
    </LandingErrorBoundary>
  );
}

export const metadata: Metadata = {
  title: "WealthJourney - Your Trusted Guide to Financial Freedom",
  description: "Track expenses, manage multiple wallets, set budgets, and visualize your financial journey with WealthJourney.",
};
```

---

## Task 13: Add Meta Tags and SEO

**Files:**

- Modify: `src/wj-client/app/landing/page.tsx`

**Step 1: Enhance metadata**

Modify: `src/wj-client/app/landing/page.tsx`

```typescript
export const metadata: Metadata = {
  title: "WealthJourney - Your Trusted Guide to Financial Freedom",
  description:
    "Track expenses, manage multiple wallets, set budgets, and visualize your financial journey with WealthJourney. Free personal finance management.",
  keywords: [
    "personal finance",
    "budget tracking",
    "expense management",
    "financial planning",
    "wallet management",
  ],
  authors: [{ name: "WealthJourney" }],
  openGraph: {
    title: "WealthJourney - Your Trusted Guide to Financial Freedom",
    description:
      "Track expenses, manage multiple wallets, set budgets, and visualize your financial journey.",
    type: "website",
    url: "https://wealthjourney.app",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "WealthJourney Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WealthJourney - Your Trusted Guide to Financial Freedom",
    description:
      "Track expenses, manage multiple wallets, set budgets, and visualize your financial journey.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};
```

---

## Task 14: Add Landing Directory to ESLint Ignore (if needed)

**Files:**

- Modify: `src/wj-client/.eslintrc.json` (or equivalent)

**Step 1: Check if ESLint configuration exists**

Run: `ls src/wj-client/ | grep -i eslint`

Expected: May show .eslintrc.json, .eslintrc.js, or eslint.config.js

**Step 2: Add landing components to any patterns if needed**

Only if there are specific patterns needed

**Step 3: Run ESLint**

Run: `cd src/wj-client && npx eslint components/landing/ --ext .ts,.tsx 2>&1 | head -50`

Expected: No critical errors (warnings acceptable)

---

## Task 15: Final Build and Test

**Step 1: Run full TypeScript check**

Run: `cd src/wj-client && npx tsc --noEmit`

Expected: No TypeScript errors

**Step 2: Run production build**

Run: `cd src/wj-client && npm run build`

Expected: Build succeeds without errors

**Step 3: Start production server to test**

Run: `cd src/wj-client && npm start`

Visit: http://localhost:3000
Verify:

- Landing page loads
- All sections are visible
- Animations play smoothly
- Mobile responsive works
- Links navigate correctly
- Sign up/Sign in buttons work

**Step 4: Test accessibility**

Run browser DevTools Lighthouse audit
Expected: Accessibility score > 90

**Step 5: Test reduced motion**

Enable prefers-reduced-motion in browser
Expected: Animations are disabled or reduced

**Step 6: Test keyboard navigation**

Tab through the page
Expected: All interactive elements are focusable and visible

---

## Task 16: Create Documentation

**Files:**

- Create: `docs/landing-page.md`

**Step 1: Write documentation**

Create: `docs/landing-page.md`

```markdown
# Landing Page Documentation

## Overview

The landing page is located at `/landing` and serves as the entry point for non-authenticated users.

## Architecture

- Next.js 15 App Router
- React 19 functional components
- Framer Motion for animations
- Tailwind CSS for styling
- Redux for auth state

## Components

### LandingNavbar

Fixed navigation bar with:

- Logo and brand name
- Navigation links (Features, How It Works, Pricing)
- Auth-aware CTAs (Sign In / Get Started or Dashboard)
- Mobile responsive hamburger menu

### LandingHero

Hero section with:

- Main headline and value proposition
- Primary and secondary CTAs
- Trust indicators (no credit card, secure, free)
- Animated content on load

### LandingFeatures

Feature grid showcasing:

- Multiple Wallets
- Transaction Tracking
- Visual Analytics
- Budget Planning
- Financial Reports
- Secure Authentication

### LandingHowItWorks

Step-by-step guide:

1. Sign Up with Google
2. Create First Wallet
3. Track Transactions
4. Gain Insights

### LandingCTA

Final call-to-action with:

- Primary signup button
- Secondary sign-in link

### LandingFooter

Footer with:

- Brand information
- Product links
- Company links
- Legal links
- Social media links
- Tech stack badges

## Styling

- Uses brand colors (bg: #008148, fg: #F7F8FC)
- Responsive design (mobile breakpoint at 800px)
- Smooth animations with reduced motion support
- Accessible focus states

## Routing

- `/` redirects based on auth state
  - Authenticated → `/dashboard/home`
  - Not authenticated → `/landing`
- `/landing` is the public landing page

## Future Enhancements

- Add actual dashboard screenshot/preview
- Add testimonials section
- Add pricing section
- Add blog/resources section
- Add live chat widget
- Add analytics tracking
```

---

## Testing Checklist

Before marking complete, verify:

### Visual Testing

- [ ] Hero section displays correctly with brand colors
- [ ] Feature cards have consistent spacing and hover effects
- [ ] How it works steps are numbered and aligned
- [ ] CTA section stands out with green background
- [ ] Footer links are organized by category

### Responsive Testing

- [ ] Mobile (< 800px): hamburger menu works
- [ ] Mobile: content stacks vertically
- [ ] Desktop (≥ 800px): grid layouts activate
- [ ] Desktop: navigation shows all links

### Functional Testing

- [ ] Navigation links scroll to correct sections
- [ ] Sign In button navigates to `/auth/login`
- [ ] Get Started button navigates to `/auth/register`
- [ ] Dashboard link navigates to `/dashboard/home` when authenticated
- [ ] Mobile menu opens/closes on toggle

### Accessibility Testing

- [ ] Skip link appears on focus
- [ ] All interactive elements have visible focus states
- [ ] Heading hierarchy is logical (h1 → h2 → h3)
- [ ] Images have alt text
- [ ] ARIA labels present where needed
- [ ] Reduced motion preference is respected

### Performance Testing

- [ ] Lighthouse performance score > 80
- [ ] Lighthouse accessibility score > 90
- [ ] No console errors
- [ ] Build completes without warnings

### Browser Testing

- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on Mac)

---

## Notes

### Animation Library

Framer Motion was chosen for:

- Declarative API
- Built-in reduced motion support
- Smooth scroll-triggered animations
- Hover states

### Accessibility

- Skip link for keyboard users
- Focus-visible rings on all interactive elements
- ARIA labels on buttons and links
- Semantic HTML (nav, main, section, footer)
- Heading hierarchy maintained

### Performance

- Images use lazy loading (below fold)
- Animations respect reduced motion
- Bundle size minimized (tree-shaking)
- Production build optimized

### Future Work

- Replace placeholder dashboard preview with actual screenshot
- Add testimonials section
- Add pricing section
- Add analytics (Google Analytics, Plausible)
- Add A/B testing framework
- Add internationalization (i18n)
