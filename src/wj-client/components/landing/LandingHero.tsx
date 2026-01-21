"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

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
    transition: { duration: 0.5 },
  },
};

// Dashboard Preview Component
function DashboardPreview() {
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  return (
    <div className="relative rounded-lg shadow-2xl overflow-hidden bg-fg">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-red-400"></div>
        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
        <div className="w-3 h-3 rounded-full bg-green-400"></div>
        <div className="flex-1 bg-gray-100 rounded-md h-6 mx-4 flex items-center px-3">
          <span className="text-xs text-gray-400">
            {origin ? `${origin}/dashboard/home` : "/dashboard/home"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div>
        <Image
          src={"/dashboard.png"}
          alt="dashboard"
          width={0}
          height={0}
          sizes="100vw"
          className="w-full h-full"
        />
      </div>
    </div>
  );
}

export default function LandingHero() {
  return (
    <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-32 overflow-hidden">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-bg/5 via-transparent to-bg/10"
        aria-hidden="true"
      />

      <motion.div
        className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="text-center">
          <motion.div variants={itemVariants}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Your Trusted Guide to{" "}
              <span className="text-bg">Financial Freedom</span>
            </h1>
          </motion.div>

          <motion.p
            variants={itemVariants}
            className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto"
          >
            Track expenses, manage multiple wallets, set budgets, and visualize
            your complete financial journey in one powerful platform.
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
              <svg
                className="w-5 h-5 text-bg"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-bg"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Secure with OAuth</span>
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-bg"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
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

        {/* Dashboard Preview */}
        <motion.div variants={itemVariants} className="mt-16">
          <DashboardPreview />
        </motion.div>
      </motion.div>
    </section>
  );
}
