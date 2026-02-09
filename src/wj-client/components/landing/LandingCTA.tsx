"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";

export default function LandingCTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section className="relative py-16 sm:py-20 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 overflow-hidden">
      {/* Background Pattern Overlay */}
      <div className="absolute inset-0 opacity-10">
        <svg
          className="h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
          width="100"
          height="100"
          viewBox="0 0 100 100"
          fill="none"
        >
          <pattern
            id="cta-pattern"
            patternUnits="userSpaceOnUse"
            width="20"
            height="20"
          >
            <circle cx="10" cy="10" r="1.5" fill="white" />
          </pattern>
          <rect width="100" height="100" fill="url(#cta-pattern)" />
        </svg>
      </div>

      <motion.div
        ref={ref}
        className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
          Start Your All-In-One Financial Journey Today
        </h2>
        <p className="text-lg text-green-100 mb-10 max-w-2xl mx-auto">
          Track cash, cards, crypto, gold, and investments in one powerful app.
          Join thousands of users managing their complete financial portfolio.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Link
            href="/auth/register"
            className="w-full sm:w-auto px-8 py-4 bg-white text-primary-600 rounded-md hover:bg-gray-100 transition-colors duration-200 font-semibold text-center focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-600"
          >
            Get Started for Free
          </Link>
          <Link
            href="/auth/login"
            className="w-full sm:w-auto px-8 py-4 border-2 border-white text-white rounded-md hover:bg-white/10 transition-colors duration-200 font-semibold text-center focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-600"
          >
            Sign In
          </Link>
        </div>

        {/* Feature Highlights */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex flex-col items-center">
            <div className="text-2xl mb-2">💳</div>
            <span className="text-sm text-green-100 font-medium">Multi-Wallet</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-2xl mb-2">📈</div>
            <span className="text-sm text-green-100 font-medium">Investments</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-2xl mb-2">🪙</div>
            <span className="text-sm text-green-100 font-medium">Gold & Crypto</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-2xl mb-2">📊</div>
            <span className="text-sm text-green-100 font-medium">Analytics</span>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
