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
    <div className="relative rounded-lg shadow-2xl overflow-hidden bg-neutral-50">
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
          src={"/dashboard.svg"}
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
    <section className="relative pt-20 pb-12 sm:pt-32 sm:pb-20 md:pt-40 md:pb-32 overflow-hidden">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-primary-600/5 via-transparent to-primary-600/10"
        aria-hidden="true"
      />

      <motion.div
        className="relative max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="text-center">
          <motion.div variants={itemVariants}>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 px-2">
              Your Trusted Guide to{" "}
              <span className="text-primary-600">Financial Freedom</span>
            </h1>
          </motion.div>

          <motion.p
            variants={itemVariants}
            className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 md:mb-10 max-w-2xl mx-auto px-4"
          >
            Track expenses, manage multiple wallets, set budgets, and visualize
            your complete financial journey in one powerful platform.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 px-4 sm:px-0"
          >
            <Link
              href="/auth/register"
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 bg-primary-600 text-white rounded-md hover:bg-primary-500 transition-colors duration-200 font-medium text-center focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 min-h-[44px] flex items-center justify-center"
            >
              Get Started for Free
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 border-2 border-primary-600 text-primary-600 rounded-md hover:bg-primary-600 hover:text-white transition-colors duration-200 font-medium text-center focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 min-h-[44px] flex items-center justify-center"
            >
              Explore Features
            </a>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="mt-8 sm:mt-10 md:mt-12 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8 text-xs sm:text-sm text-gray-500 px-4"
          >
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-primary-600"
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
                className="w-5 h-5 text-primary-600"
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
                className="w-5 h-5 text-primary-600"
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
        <motion.div variants={itemVariants} className="mt-10 sm:mt-12 md:mt-16 px-2 sm:px-4">
          <DashboardPreview />
        </motion.div>
      </motion.div>
    </section>
  );
}
