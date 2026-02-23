"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";

const supportedFormats = [
  {
    icon: "📄",
    format: "CSV",
    description: "Comma-separated values",
    maxSize: "10MB",
  },
  {
    icon: "📊",
    format: "Excel",
    description: ".xlsx, .xls files",
    maxSize: "10MB",
  },
  {
    icon: "📋",
    format: "PDF",
    description: "Bank statements",
    maxSize: "20MB",
  },
];

const supportedBanks = [
  { name: "Vietcombank", code: "VCB", logo: "🏦" },
  { name: "Techcombank", code: "TCB", logo: "🏦" },
  { name: "Vietinbank", code: "VTB", logo: "🏦" },
  { name: "ACB", code: "ACB", logo: "🏦" },
  { name: "MB Bank", code: "MB", logo: "🏦" },
  { name: "Custom Format", code: "CUSTOM", logo: "⚙️" },
];

const importFeatures = [
  {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
    title: "Smart Duplicate Detection",
    description:
      "99% accuracy prevents duplicate entries with multi-level matching (exact, strong, likely, possible).",
  },
  {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
        />
      </svg>
    ),
    title: "Auto-Categorization",
    description:
      "Intelligent merchant database and keyword matching auto-suggests categories with confidence scores.",
  },
  {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    title: "Multi-Currency Support",
    description:
      "Automatic FX conversion for 12+ currencies with historical exchange rates from trusted APIs.",
  },
  {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
    ),
    title: "Review & Edit",
    description:
      "Inline editing with real-time validation. Fix errors, adjust categories, and handle duplicates before import.",
  },
  {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z"
        />
      </svg>
    ),
    title: "24-Hour Undo",
    description:
      "Made a mistake? Undo any import within 24 hours to restore the pre-import state completely.",
  },
  {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
    title: "Lightning Fast",
    description:
      "Import 500+ transactions in under 10 minutes with optimized parsing and bulk insert operations.",
  },
];

const steps = [
  {
    number: 1,
    title: "Upload Statement",
    description:
      "Drag & drop your CSV, Excel, or PDF bank statement. Supports up to 10,000 transactions per file.",
    icon: "📤",
  },
  {
    number: 2,
    title: "Review & Confirm",
    description:
      "Smart system auto-categorizes transactions, detects duplicates, and flags errors for your review.",
    icon: "✅",
  },
  {
    number: 3,
    title: "Import Complete",
    description:
      "Transactions imported instantly. View summary, edit categories, or undo within 24 hours if needed.",
    icon: "🎉",
  },
];

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
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export default function LandingBankImport() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section
      id="bank-import"
      className="py-16 sm:py-20 bg-gradient-to-br from-primary-50 via-white to-primary-50 [scroll-margin-top:5rem]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          ref={ref}
          className="text-center mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center justify-center px-4 py-2 mb-4 text-sm font-medium text-primary-700 bg-primary-100 rounded-full">
            <span className="mr-2">⚡</span>
            Bulk Import
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Stop Typing, Start Importing
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto px-4">
            Import hundreds of transactions in minutes. Upload your bank
            statement in CSV, Excel, or PDF format and let our smart system
            handle the rest. No more manual entry tedium.
          </p>
        </motion.div>

        {/* Supported Formats */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12 max-w-3xl mx-auto"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={
            isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }
          }
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {supportedFormats.map((format, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300 text-center"
            >
              <div className="text-4xl mb-2">{format.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {format.format}
              </h3>
              <p className="text-sm text-gray-600 mb-1">{format.description}</p>
              <p className="text-xs text-primary-600 font-medium">
                Max {format.maxSize}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Supported Banks */}
        {/* <motion.div
          className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-6">
            Pre-Built Templates for Vietnamese Banks
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {supportedBanks.map((bank, index) => (
              <div
                key={index}
                className="flex flex-col items-center p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors duration-200"
              >
                <div className="text-3xl mb-2">{bank.logo}</div>
                <div className="text-sm font-semibold text-gray-900 text-center">
                  {bank.name}
                </div>
                <div className="text-xs text-gray-500">{bank.code}</div>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-600 mt-4">
            Don't see your bank? Use <span className="font-semibold text-primary-600">Custom Format</span> with automatic column detection.
          </p>
        </motion.div> */}

        {/* Key Features Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {importFeatures.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-white rounded-lg p-6 shadow-md hover:shadow-xl transition-shadow duration-300"
            >
              <div className="w-12 h-12 bg-primary-600/10 rounded-lg flex items-center justify-center text-primary-600 mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* How It Works Steps */}
        <motion.div
          className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 rounded-2xl p-8 sm:p-12 text-white"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={
            isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }
          }
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h3 className="text-2xl sm:text-3xl font-bold text-center mb-10">
            How Bank Import Works
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-3xl mb-4">
                    {step.icon}
                  </div>
                  <div className="absolute -top-2 -left-2 w-8 h-8 bg-white text-primary-600 rounded-full flex items-center justify-center font-bold text-sm">
                    {step.number}
                  </div>
                  <h4 className="text-lg font-semibold mb-2">{step.title}</h4>
                  <p className="text-sm text-primary-100 leading-relaxed">
                    {step.description}
                  </p>
                </div>
                {/* {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 -right-3 w-6 h-0.5 bg-white/30" />
                )} */}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Statistics */}
        <motion.div
          className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="text-center p-6 bg-white rounded-xl shadow-md">
            <div className="text-3xl sm:text-4xl font-extrabold text-primary-600 mb-2">
              10,000
            </div>
            <div className="text-sm text-gray-600">
              Max Transactions per Import
            </div>
          </div>
          <div className="text-center p-6 bg-white rounded-xl shadow-md">
            <div className="text-3xl sm:text-4xl font-extrabold text-primary-600 mb-2">
              99%
            </div>
            <div className="text-sm text-gray-600">
              Duplicate Detection Accuracy
            </div>
          </div>
          <div className="text-center p-6 bg-white rounded-xl shadow-md">
            <div className="text-3xl sm:text-4xl font-extrabold text-primary-600 mb-2">
              &lt;10min
            </div>
            <div className="text-sm text-gray-600">
              Import 500+ Transactions
            </div>
          </div>
          <div className="text-center p-6 bg-white rounded-xl shadow-md">
            <div className="text-3xl sm:text-4xl font-extrabold text-primary-600 mb-2">
              24hrs
            </div>
            <div className="text-sm text-gray-600">Undo Window Available</div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <p className="text-gray-700 mb-6 text-lg">
            Stop forgetting to track expenses. Import your statement once a
            month and stay on top of your finances.
          </p>
          <a
            href="/auth/register"
            className="inline-block px-8 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 font-semibold text-lg focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
          >
            Get Started Free
          </a>
        </motion.div>
      </div>
    </section>
  );
}
