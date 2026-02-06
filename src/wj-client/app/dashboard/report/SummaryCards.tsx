"use client";

import React, { memo } from "react";
import { BaseCard } from "@/components/BaseCard";
import { formatCurrency } from "@/utils/currency-formatter";
import { useAnimatedNumber, useAnimatedPercentage } from "@/components/charts/useAnimatedNumber";
import { Sparkline } from "@/components/charts";
import Image from "next/image";
import { resources } from "@/app/constants";

/**
 * Financial summary data structure
 */
export interface FinancialSummaryData {
  /** Total income for the period */
  totalIncome: number;
  /** Total expenses for the period */
  totalExpenses: number;
  /** Net savings (income - expenses) */
  netSavings: number;
  /** Savings rate as percentage */
  savingsRate: number;
  /** Top expense category */
  topExpenseCategory?: {
    name: string;
    amount: number;
  };
  /** Previous period data for comparison (optional) */
  previousPeriod?: {
    totalIncome: number;
    totalExpenses: number;
    netSavings: number;
    savingsRate: number;
  };
  /** Currency code */
  currency: string;
  /** Historical data for trend charts (optional) */
  incomeHistory?: { value: number; date: string }[];
  expenseHistory?: { value: number; date: string }[];
}

/**
 * SummaryCards component props
 */
export interface SummaryCardsProps {
  /** Financial summary data */
  data: FinancialSummaryData;
}

/**
 * Individual summary card component
 */
interface SummaryCardProps {
  label: string;
  value: string;
  subtitle?: string;
  color: "green" | "red" | "blue" | "neutral";
  icon?: string;
  change?: number;
  changeLabel?: string;
  showSparkline?: boolean;
  sparklineData?: { value: number }[];
}

const SummaryCard = memo(function SummaryCard({
  label,
  value,
  subtitle,
  color,
  icon,
  change,
  changeLabel,
  showSparkline,
  sparklineData,
}: SummaryCardProps) {
  const colorClasses = {
    green: {
      bg: "bg-green-50",
      text: "text-green-700",
      icon: "bg-green-100",
    },
    red: {
      bg: "bg-red-50",
      text: "text-red-700",
      icon: "bg-red-100",
    },
    blue: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      icon: "bg-blue-100",
    },
    neutral: {
      bg: "bg-neutral-50",
      text: "text-neutral-700",
      icon: "bg-neutral-100",
    },
  };

  const colors = colorClasses[color];

  return (
    <BaseCard className="p-4 hover:shadow-md transition-shadow">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-neutral-600">{label}</span>
          {icon && (
            <div className={`w-8 h-8 rounded-full ${colors.icon} flex items-center justify-center`}>
              <Image src={icon} alt={label} width={16} height={16} />
            </div>
          )}
        </div>

        {/* Value */}
        <div className="text-2xl font-bold text-neutral-900">{value}</div>

        {/* Subtitle/Change */}
        {subtitle && (
          <div className="text-xs text-neutral-500">{subtitle}</div>
        )}

        {change !== undefined && (
          <div className={`text-xs font-medium ${change >= 0 ? "text-green-600" : "text-red-600"}`}>
            {change >= 0 ? "+" : ""}
            {change.toFixed(1)}%
            {changeLabel && ` ${changeLabel}`}
          </div>
        )}

        {/* Sparkline */}
        {showSparkline && sparklineData && sparklineData.length > 1 && (
          <div className="pt-2">
            <Sparkline data={sparklineData} height={40} />
          </div>
        )}
      </div>
    </BaseCard>
  );
});

/**
 * SummaryCards - Financial report summary cards with comparisons and trends
 *
 * Features:
 * - Total Income card
 * - Total Expenses card
 * - Net Savings card
 * - Savings Rate card
 * - Top Expense Category
 * - Comparison with previous period
 * - Trend sparklines
 */
export const SummaryCards = memo(function SummaryCards({ data }: SummaryCardsProps) {
  const {
    totalIncome,
    totalExpenses,
    netSavings,
    savingsRate,
    topExpenseCategory,
    previousPeriod,
    currency,
    incomeHistory,
    expenseHistory,
  } = data;

  // Animated values
  const animatedIncome = useAnimatedNumber(totalIncome, 1000);
  const animatedExpenses = useAnimatedNumber(totalExpenses, 1000);
  const animatedSavings = useAnimatedNumber(netSavings, 1000);
  const animatedRate = useAnimatedPercentage(savingsRate, 1000);

  // Calculate changes from previous period
  const incomeChange = previousPeriod
    ? ((totalIncome - previousPeriod.totalIncome) / previousPeriod.totalIncome) * 100
    : undefined;

  const expensesChange = previousPeriod
    ? ((totalExpenses - previousPeriod.totalExpenses) / previousPeriod.totalExpenses) * 100
    : undefined;

  const savingsChange = previousPeriod
    ? ((netSavings - previousPeriod.netSavings) / Math.abs(previousPeriod.netSavings || 1)) * 100
    : undefined;

  const rateChange = previousPeriod
    ? savingsRate - previousPeriod.savingsRate
    : undefined;

  // Prepare sparkline data
  const incomeSparkline = incomeHistory?.map((h) => ({ value: h.value })) || [];
  const expenseSparkline = expenseHistory?.map((h) => ({ value: h.value })) || [];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
      {/* Total Income */}
      <SummaryCard
        label="Total Income"
        value={formatCurrency(animatedIncome, currency)}
        color="green"
        icon={`${resources}/income.svg`}
        change={incomeChange}
        changeLabel="vs last period"
        showSparkline={incomeSparkline.length > 1}
        sparklineData={incomeSparkline}
      />

      {/* Total Expenses */}
      <SummaryCard
        label="Total Expenses"
        value={formatCurrency(animatedExpenses, currency)}
        color="red"
        icon={`${resources}/expense.svg`}
        change={expensesChange}
        changeLabel="vs last period"
        showSparkline={expenseSparkline.length > 1}
        sparklineData={expenseSparkline}
      />

      {/* Net Savings */}
      <SummaryCard
        label="Net Savings"
        value={formatCurrency(animatedSavings, currency)}
        subtitle={netSavings >= 0 ? "Positive cash flow" : "Negative cash flow"}
        color={netSavings >= 0 ? "blue" : "red"}
        icon={`${resources}/savings.svg`}
        change={savingsChange}
        changeLabel="vs last period"
      />

      {/* Savings Rate */}
      <SummaryCard
        label="Savings Rate"
        value={`${animatedRate.toFixed(1)}%`}
        subtitle={savingsRate >= 20 ? "Excellent!" : savingsRate >= 10 ? "Good" : "Needs improvement"}
        color="neutral"
        icon={`${resources}/percent.svg`}
        change={rateChange}
        changeLabel="pp change"
      />

      {/* Top Expense Category */}
      {topExpenseCategory && (
        <SummaryCard
          label="Top Expense"
          value={formatCurrency(topExpenseCategory.amount, currency)}
          subtitle={topExpenseCategory.name}
          color="neutral"
          icon={`${resources}/category.svg`}
        />
      )}
    </div>
  );
});
