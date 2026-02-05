"use client";

/**
 * Enhanced Report Page with Comprehensive Data Visualization
 *
 * Phase 5 Refactoring: Mobile-optimized financial reports with charts
 *
 * Features:
 * - Period selector with presets and custom range
 * - Summary cards with animated numbers and sparklines
 * - Expense breakdown chart (donut)
 * - Income vs Expense trend (line chart)
 * - Category breakdown (bar chart)
 * - Export options
 */

import { useState, useMemo } from "react";
import { BaseCard } from "@/components/BaseCard";
import { formatCurrency } from "@/utils/currency-formatter";
import { useQueryGetFinancialReport } from "@/utils/generated/hooks";
import { exportFinancialReportToCSV } from "@/utils/csv-export";
import { PeriodSelector, PeriodType, DateRange } from "./PeriodSelector";
import { SummaryCards, FinancialSummaryData } from "./SummaryCards";
import { LineChart, BarChart, DonutChart } from "@/components/charts";
import { motion } from "framer-motion";
import { ExportOptions, ExportButton } from "@/components/export/ExportDialog";

export default function ReportPageEnhanced() {
  const [selectedPeriod, setSelectedPeriod] =
    useState<PeriodType>("this-month");
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [compareWithPrevious, setCompareWithPrevious] = useState(false);
  const [selectedWalletIds, setSelectedWalletIds] = useState<number[]>([]);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Fetch financial report data
  const {
    data: reportData,
    isLoading,
    error,
    refetch,
  } = useQueryGetFinancialReport(
    {
      year: new Date().getFullYear(),
      walletIds: selectedWalletIds ?? [],
    },
    {
      refetchOnMount: "always",
      enabled: !!selectedPeriod,
    },
  );

  // Handle period change
  const handlePeriodChange = (period: PeriodType, range?: DateRange) => {
    setSelectedPeriod(period);
    setCustomRange(range);
    // In a real implementation, this would trigger a new API call with the date range
    refetch();
  };

  // Handle export with dialog options
  const handleExport = async (options: ExportOptions) => {
    try {
      // Map the period to year for the existing export function
      const year = selectedPeriod === "this-month" || selectedPeriod === "last-month"
        ? new Date().getFullYear()
        : new Date().getFullYear();

      switch (options.format) {
        case "csv":
          exportFinancialReportToCSV(reportData, year);
          break;
        case "pdf":
          // TODO: Implement PDF export
          alert("PDF export coming soon!");
          break;
        case "excel":
          // TODO: Implement Excel export
          alert("Excel export coming soon!");
          break;
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to export");
    }
  };

  // Mock summary data (in real implementation, this would come from the API)
  const summaryData: FinancialSummaryData = useMemo(() => {
    return {
      totalIncome: 5000,
      totalExpenses: 3200,
      netSavings: 1800,
      savingsRate: 36,
      topExpenseCategory: {
        name: "Food & Dining",
        amount: 800,
      },
      currency: "USD",
      incomeHistory: [
        { value: 4200, date: "Jan" },
        { value: 4500, date: "Feb" },
        { value: 4800, date: "Mar" },
        { value: 4700, date: "Apr" },
        { value: 5000, date: "May" },
      ],
      expenseHistory: [
        { value: 2800, date: "Jan" },
        { value: 3000, date: "Feb" },
        { value: 3100, date: "Mar" },
        { value: 2900, date: "Apr" },
        { value: 3200, date: "May" },
      ],
    };
  }, []);

  // Mock expense category breakdown data
  const expenseCategories = useMemo(() => {
    return [
      { name: "Food & Dining", value: 800, color: "#ef4444" },
      { name: "Transportation", value: 450, color: "#f59e0b" },
      { name: "Shopping", value: 600, color: "#8b5cf6" },
      { name: "Entertainment", value: 350, color: "#ec4899" },
      { name: "Bills & Utilities", value: 700, color: "#3b82f6" },
      { name: "Others", value: 300, color: "#6b7280" },
    ];
  }, []);

  // Mock income vs expense trend data
  const trendData = useMemo(() => {
    return [
      { month: "Jan", income: 4200, expenses: 2800, net: 1400 },
      { month: "Feb", income: 4500, expenses: 3000, net: 1500 },
      { month: "Mar", income: 4800, expenses: 3100, net: 1700 },
      { month: "Apr", income: 4700, expenses: 2900, net: 1800 },
      { month: "May", income: 5000, expenses: 3200, net: 1800 },
      { month: "Jun", income: 5200, expenses: 3300, net: 1900 },
    ];
  }, []);

  // Mock category comparison data
  const categoryComparisonData = useMemo(() => {
    return [
      { category: "Food", thisMonth: 800, lastMonth: 750 },
      { category: "Transport", thisMonth: 450, lastMonth: 500 },
      { category: "Shopping", thisMonth: 600, lastMonth: 400 },
      { category: "Entertainment", thisMonth: 350, lastMonth: 300 },
      { category: "Bills", thisMonth: 700, lastMonth: 700 },
      { category: "Others", thisMonth: 300, lastMonth: 250 },
    ];
  }, []);

  return (
    <div className="flex flex-col gap-4 px-3 sm:px-6 py-3 sm:py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900">
          Financial Report
        </h1>
        <ExportButton
          onExport={handleExport}
          categories={[]} // TODO: Add category data if available
        />
      </div>

      {/* Period Selector */}
      <div className="w-full">
        <PeriodSelector
          selectedPeriod={selectedPeriod}
          customRange={customRange}
          onPeriodChange={handlePeriodChange}
          showCompare={true}
          compareWithPrevious={compareWithPrevious}
          onCompareChange={setCompareWithPrevious}
        />
      </div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <SummaryCards data={summaryData} />
      </motion.div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Expense Breakdown - Donut Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <BaseCard className="p-4">
            <h3 className="text-lg font-bold text-neutral-900 mb-4">
              Expense Breakdown
            </h3>
            <div className="h-72">
              <DonutChart
                data={expenseCategories}
                innerRadius="50%"
                outerRadius="75%"
                height={288}
                showLegend={true}
                legendPosition="right"
                tooltipFormatter={(value) => [
                  formatCurrency(value, "USD"),
                  "Amount",
                ]}
              />
            </div>
          </BaseCard>
        </motion.div>

        {/* Category Comparison - Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <BaseCard className="p-4">
            <h3 className="text-lg font-bold text-neutral-900 mb-4">
              Category Comparison
              {compareWithPrevious && (
                <span className="text-sm font-normal text-neutral-600 ml-2">
                  vs Previous Period
                </span>
              )}
            </h3>
            <div className="h-72">
              <BarChart
                data={categoryComparisonData}
                xAxisKey="category"
                series={[
                  {
                    dataKey: "thisMonth",
                    name: "This Month",
                    color: "#10b981",
                  },
                  ...(compareWithPrevious
                    ? [
                        {
                          dataKey: "lastMonth",
                          name: "Last Month",
                          color: "#94a3b8",
                        } as const,
                      ]
                    : []),
                ]}
                height={288}
                showLegend={true}
                yAxisFormatter={(value) => formatCurrency(value, "USD")}
                xAxisFormatter={(label) => label}
              />
            </div>
          </BaseCard>
        </motion.div>
      </div>

      {/* Income vs Expense Trend - Line Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <BaseCard className="p-4">
          <h3 className="text-lg font-bold text-neutral-900 mb-4">
            Income vs Expenses Trend
          </h3>
          <div className="h-80">
            <LineChart
              data={trendData}
              xAxisKey="month"
              series={[
                {
                  dataKey: "income",
                  name: "Income",
                  color: "#10b981",
                  showArea: true,
                  curveType: "monotone",
                },
                {
                  dataKey: "expenses",
                  name: "Expenses",
                  color: "#ef4444",
                  showArea: true,
                  curveType: "monotone",
                },
                {
                  dataKey: "net",
                  name: "Net Savings",
                  color: "#3b82f6",
                  showArea: false,
                  curveType: "monotone",
                  strokeWidth: 3,
                },
              ]}
              height={320}
              showGrid={true}
              showTooltip={true}
              showLegend={true}
              yAxisFormatter={(value) => formatCurrency(value, "USD")}
            />
          </div>
        </BaseCard>
      </motion.div>

      {/* Detailed Financial Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <BaseCard className="p-4">
          <h3 className="text-lg font-bold text-neutral-900 mb-4">
            Monthly Summary
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700">
                    Month
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-neutral-700">
                    Income
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-neutral-700">
                    Expenses
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-neutral-700">
                    Net Savings
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-neutral-700">
                    Savings Rate
                  </th>
                </tr>
              </thead>
              <tbody>
                {trendData.map((row, index) => (
                  <tr
                    key={index}
                    className="border-b border-neutral-100 hover:bg-neutral-50"
                  >
                    <td className="py-3 px-4 font-medium text-neutral-900">
                      {row.month}
                    </td>
                    <td className="py-3 px-4 text-right text-green-600 font-medium">
                      {formatCurrency(row.income, "USD")}
                    </td>
                    <td className="py-3 px-4 text-right text-red-600 font-medium">
                      {formatCurrency(row.expenses, "USD")}
                    </td>
                    <td className="py-3 px-4 text-right text-neutral-900 font-medium">
                      {formatCurrency(row.net, "USD")}
                    </td>
                    <td className="py-3 px-4 text-right text-neutral-600">
                      {((row.net / row.income) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BaseCard>
      </motion.div>
    </div>
  );
}
