"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const investmentFeatures = [
  {
    title: "All Assets, One Platform",
    description: "Track ALL your investments in one unified portfolio",
    items: [
      { icon: "📈", label: "Stocks" },
      { icon: "🏛️", label: "ETFs" },
      { icon: "💼", label: "Mutual Funds" },
      { icon: "₿", label: "Cryptocurrency" },
      { icon: "🥇", label: "Gold" },
      { icon: "🥈", label: "Silver" },
    ],
  },
  {
    title: "Powerful Analytics",
    description: "FIFO accounting and smart metrics across ALL your assets",
    items: [
      { icon: "📉", label: "FIFO Cost Basis" },
      { icon: "📈", label: "Realized PNL" },
      { icon: "💹", label: "Unrealized PNL" },
      { icon: "🎯", label: "Asset Allocation" },
      { icon: "📊", label: "Performance Tracking" },
      { icon: "⚡", label: "Real-Time Updates" },
    ],
  },
  {
    title: "Gold & Silver Support",
    description: "Unique support for precious metals with flexible unit conversions",
    items: [
      { icon: "🇻🇳", label: "SJC Gold (10 Types)" },
      { icon: "🌍", label: "World Gold (XAU)" },
      { icon: "🥈", label: "Silver" },
      { icon: "⚖️", label: "Tael/Gram/Ounce" },
      { icon: "💱", label: "Multi-Currency" },
      { icon: "🏷️", label: "Live Pricing" },
    ],
  },
];

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
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export default function LandingInvestmentFeatures() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-br from-primary-50 via-white to-primary-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          className="text-center mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            <span className="text-primary-600">All-In-One</span> Investment Tracking
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto px-4">
            Why juggle Coinbase, Robinhood, spreadsheets, and gold dealers? Track{" "}
            <strong>stocks, ETFs, mutual funds, crypto, gold, and silver</strong> in
            one unified platform with FIFO accounting, real-time market data, and
            powerful analytics.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {investmentFeatures.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="bg-white rounded-xl p-6 sm:p-8 shadow-md hover:shadow-xl transition-shadow duration-300"
            >
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-6">
                {feature.description}
              </p>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {feature.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 sm:p-3 bg-neutral-50 rounded-lg hover:bg-primary-50 transition-colors duration-200"
                  >
                    <span className="text-lg sm:text-xl">{item.icon}</span>
                    <span className="text-xs sm:text-sm font-medium text-gray-700">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Call-out section */}
        <motion.div
          className="mt-12 sm:mt-16 bg-primary-600 rounded-xl p-6 sm:p-8 text-center text-white"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h3 className="text-xl sm:text-2xl font-bold mb-3">
            One Portfolio. All Assets. Complete Picture.
          </h3>
          <p className="text-sm sm:text-base text-primary-100 max-w-3xl mx-auto leading-relaxed">
            FIFO accounting across ALL asset types - stocks, ETFs, mutual funds, crypto, gold,
            and silver. Track realized/unrealized PNL, cost basis, and your complete net worth
            in one unified dashboard with automatic lot tracking.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
