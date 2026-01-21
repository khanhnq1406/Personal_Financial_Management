"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";

export default function LandingCTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section className="py-20 bg-bg">
      <motion.div
        ref={ref}
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
          Ready to Take Control of Your Finances?
        </h2>
        <p className="text-lg text-green-100 mb-10 max-w-2xl mx-auto">
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
