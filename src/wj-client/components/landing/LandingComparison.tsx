"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const comparisons = [
  {
    feature: "All-In-One Platform",
    wealthJourney: "Stocks, ETFs, Crypto, Gold, Silver + Budgets in ONE app",
    others: "Need 3-5 different apps",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  {
    feature: "Investment Asset Coverage",
    wealthJourney: "6+ asset types unified (stocks, ETFs, funds, crypto, gold, silver)",
    others: "Stocks only or separate apps per asset",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  {
    feature: "Gold & Silver Support",
    wealthJourney: "Native support with 10+ SJC gold types",
    others: "Not available anywhere",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  {
    feature: "Market Data Integration",
    wealthJourney: "Yahoo Finance with real-time updates",
    others: "Manual entry or paid tier",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  {
    feature: "Multi-Currency Support",
    wealthJourney: "12+ currencies with FX conversion",
    others: "Limited or premium-only",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  {
    feature: "Export & Reporting",
    wealthJourney: "CSV, PDF, Excel - unlimited",
    others: "Limited exports or paid tier",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  {
    feature: "Pricing",
    wealthJourney: "Free forever - no hidden costs",
    others: "Freemium or subscription",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4 },
  },
};

export default function LandingComparison() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section className="py-16 sm:py-20 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          className="text-center mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Stop Juggling Multiple Apps
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto px-4">
            Most investors use Coinbase for crypto, Robinhood for stocks, spreadsheets
            for gold, and another app for budgets. WealthJourney gives you{" "}
            <strong>everything in one unified platform</strong> with powerful tools you'll love.
          </p>
        </motion.div>

        <motion.div
          ref={ref}
          className="max-w-5xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {/* Desktop Table View */}
          <div className="hidden sm:block bg-white rounded-xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-primary-600 text-white">
                  <th className="py-4 px-6 text-left font-semibold">Feature</th>
                  <th className="py-4 px-6 text-left font-semibold">WealthJourney</th>
                  <th className="py-4 px-6 text-left font-semibold">Other Apps</th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((item, idx) => (
                  <motion.tr
                    key={idx}
                    variants={itemVariants}
                    className="border-b border-gray-100 hover:bg-primary-50/30 transition-colors"
                  >
                    <td className="py-4 px-6 font-medium text-gray-900">
                      {item.feature}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className="text-primary-600 flex-shrink-0">
                          {item.icon}
                        </span>
                        <span className="text-gray-700">{item.wealthJourney}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-500">{item.others}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="sm:hidden space-y-4">
            {comparisons.map((item, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="bg-white rounded-lg p-5 shadow-md"
              >
                <h3 className="font-bold text-gray-900 mb-3 text-base">
                  {item.feature}
                </h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-primary-600 flex-shrink-0 mt-0.5">
                      {item.icon}
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-primary-600 mb-1">
                        WealthJourney
                      </div>
                      <div className="text-sm text-gray-700">
                        {item.wealthJourney}
                      </div>
                    </div>
                  </div>
                  <div className="pl-8 pt-2 border-l-2 border-gray-200">
                    <div className="text-xs font-semibold text-gray-500 mb-1">
                      Other Apps
                    </div>
                    <div className="text-sm text-gray-500">{item.others}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
