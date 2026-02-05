"use client";

import React, { memo, useMemo, useState } from "react";
import { BaseCard } from "@/components/BaseCard";
import { formatCurrency } from "@/utils/currency-formatter";
import {
  useAnimatedNumber,
  useAnimatedPercentage,
} from "@/components/charts/useAnimatedNumber";
import { Sparkline, DonutChart } from "@/components/charts";
import { Button } from "@/components/Button";
import { ButtonType, resources } from "@/app/constants";
import Image from "next/image";

/**
 * Portfolio summary data structure
 */
export interface PortfolioSummaryData {
  displayTotalValue?: { amount: number; currency: string };
  totalValue?: number;
  displayTotalCost?: { amount: number; currency: string };
  totalCost?: number;
  displayTotalPnl?: { amount: number; currency: string };
  totalPnl?: number;
  displayCurrency?: string;
  currency?: string;
  totalInvestments?: number;
  /** Historical data for sparkline (optional) */
  historicalValues?: { value: number; date: string }[];
  /** Asset allocation data (optional) */
  assetAllocation?: { name: string; value: number; color?: string }[];
}

/**
 * Enhanced PortfolioSummary component props
 */
export interface PortfolioSummaryEnhancedProps {
  /** Portfolio summary data from API */
  portfolioSummary: PortfolioSummaryData;
  /** User's preferred currency */
  userCurrency: string;
  /** Callback for refresh action */
  onRefreshPrices?: () => void;
  /** Callback for add investment action */
  onAddInvestment?: () => void;
  /** Whether refresh is in progress */
  isRefreshing?: boolean;
}

/**
 * StatCard component for individual summary metrics
 */
interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  color?: "green" | "red" | "neutral";
  trend?: number;
  icon?: React.ReactNode;
  showSparkline?: boolean;
  sparklineData?: { value: number }[];
}

const StatCard = memo(function StatCard({
  label,
  value,
  subtitle,
  color = "neutral",
  trend,
  icon,
  showSparkline,
  sparklineData,
}: StatCardProps) {
  const colorClasses = {
    green: "text-green-600",
    red: "text-red-600",
    neutral: "text-neutral-900",
  };

  return (
    <BaseCard className="p-3 sm:p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div className="text-sm text-neutral-600">{label}</div>
        {icon && <div className="flex-shrink-0">{icon}</div>}
      </div>

      <div
        className={`text-lg sm:text-xl lg:text-2xl font-semibold mt-1 ${colorClasses[color]}`}
      >
        {value}
      </div>

      {subtitle && (
        <div className="text-xs text-neutral-500 mt-1">{subtitle}</div>
      )}

      {trend !== undefined && (
        <div
          className={`text-xs font-medium mt-1 ${trend >= 0 ? "text-green-600" : "text-red-600"}`}
        >
          {trend >= 0 ? "+" : ""}
          {trend.toFixed(2)}%
        </div>
      )}

      {showSparkline && sparklineData && sparklineData.length > 1 && (
        <div className="mt-2">
          <Sparkline data={sparklineData} height={40} />
        </div>
      )}
    </BaseCard>
  );
});

/**
 * Enhanced PortfolioSummary component with animated counters, sparklines, and asset allocation
 *
 * Features:
 * - Animated number counters
 * - Sparkline trend indicators
 * - Asset allocation donut chart
 * - Quick action buttons
 * - Mobile-optimized layout
 */
export const PortfolioSummaryEnhanced = memo(function PortfolioSummaryEnhanced({
  portfolioSummary,
  userCurrency,
  onRefreshPrices,
  onAddInvestment,
  isRefreshing = false,
}: PortfolioSummaryEnhancedProps) {
  const [showAssetAllocation, setShowAssetAllocation] = useState(false);

  // Extract values
  const displayValue =
    portfolioSummary.displayTotalValue?.amount ??
    portfolioSummary.totalValue ??
    0;
  const displayCost =
    portfolioSummary.displayTotalCost?.amount ??
    portfolioSummary.totalCost ??
    0;
  const displayPnl =
    portfolioSummary.displayTotalPnl?.amount ?? portfolioSummary.totalPnl ?? 0;
  const displayCurrency =
    portfolioSummary.displayCurrency ||
    portfolioSummary.currency ||
    userCurrency;

  // Animated values
  const animatedValue = useAnimatedNumber(displayValue, 1200);
  const animatedCost = useAnimatedNumber(displayCost, 1200);
  const animatedPnl = useAnimatedNumber(displayPnl, 1200);
  const animatedHoldings = useAnimatedNumber(
    portfolioSummary.totalInvestments || 0,
    800,
  );

  // Calculate PNL percentage
  const pnlPercent = displayCost > 0 ? (displayPnl / displayCost) * 100 : 0;

  // Prepare sparkline data (mock data for now - would come from API)
  const sparklineData = useMemo(() => {
    if (portfolioSummary.historicalValues) {
      return portfolioSummary.historicalValues.map((v) => ({ value: v.value }));
    }
    // Generate mock trend data based on current value
    const currentValue = displayValue;
    const variance = currentValue * 0.1; // 10% variance
    return Array.from({ length: 10 }, (_, i) => ({
      value:
        currentValue -
        variance +
        (variance * 2 * i) / 9 +
        (Math.random() - 0.5) * variance * 0.2,
    }));
  }, [displayValue, portfolioSummary.historicalValues]);

  // Prepare asset allocation data
  const assetAllocationData = useMemo(() => {
    if (portfolioSummary.assetAllocation) {
      return portfolioSummary.assetAllocation;
    }
    // Mock data based on holdings count
    const holdings = portfolioSummary.totalInvestments || 0;
    if (holdings === 0) return [];

    const types = ["Stocks", "Crypto", "ETFs", "Gold"];
    const avgPerType = displayValue / Math.max(holdings, 1);
    return types.map((type, i) => ({
      name: type,
      value: Math.round(avgPerType * (0.5 + Math.random() * 1)),
      color: undefined,
    }));
  }, [
    displayValue,
    portfolioSummary.assetAllocation,
    portfolioSummary.totalInvestments,
  ]);

  // Top performer (mock calculation)
  const topPerformer = useMemo(() => {
    return {
      name: "Best Performer",
      value: "+12.5%",
      positive: true,
    };
  }, []);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Main Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total Value"
          value={formatCurrency(animatedValue, displayCurrency)}
          color="neutral"
          sparklineData={sparklineData}
          showSparkline
        />

        <StatCard
          label="Total Cost"
          value={formatCurrency(animatedCost, displayCurrency)}
          color="neutral"
        />

        <StatCard
          label="Total PNL"
          value={formatCurrency(animatedPnl, displayCurrency)}
          subtitle={`${pnlPercent >= 0 ? "+" : ""}${pnlPercent.toFixed(2)}%`}
          color={displayPnl >= 0 ? "green" : "red"}
          trend={pnlPercent}
        />

        <StatCard
          label="Holdings"
          value={animatedHoldings.toString()}
          color="neutral"
          icon={
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
          }
        />
      </div>

      {/* Asset Allocation Card */}
      {assetAllocationData.length > 0 && (
        <BaseCard className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-bold text-neutral-900">
                Asset Allocation
              </h3>
              <p className="text-sm text-neutral-600 mt-1">
                Distribution by investment type
              </p>
            </div>
            {topPerformer && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100">
                <span className="text-xs text-green-700 font-medium">
                  {topPerformer.name}
                </span>
                <span className="text-xs font-bold text-green-700">
                  {topPerformer.value}
                </span>
              </div>
            )}
          </div>

          <div className="relative h-64 sm:h-72">
            <DonutChart
              data={assetAllocationData}
              innerRadius="60%"
              outerRadius="80%"
              height={288}
              centerLabel={formatCurrency(displayValue, displayCurrency)}
              centerSubLabel="Total Portfolio"
              showLegend={true}
              legendPosition="right"
            />
          </div>
        </BaseCard>
      )}

      {/* Quick Actions Card */}
      <BaseCard className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Button
            type={ButtonType.PRIMARY}
            onClick={onAddInvestment}
            className="flex-1"
          >
            <div className="flex items-center justify-center gap-2">
              <Image
                src={`${resources}/plus.png`}
                alt="Add"
                width={20}
                height={20}
              />
              <span>Add Investment</span>
            </div>
          </Button>

          <Button
            type={ButtonType.SECONDARY}
            onClick={onRefreshPrices}
            disabled={isRefreshing}
            loading={isRefreshing}
            className="flex-1"
          >
            <div className="flex items-center justify-center gap-2">
              <Image
                src={`${resources}/refresh.png`}
                alt="Refresh"
                width={20}
                height={20}
              />
              <span>Refresh Prices</span>
            </div>
          </Button>
        </div>
      </BaseCard>
    </div>
  );
});
