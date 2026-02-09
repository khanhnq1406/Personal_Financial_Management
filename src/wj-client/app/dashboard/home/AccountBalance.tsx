"use client";

import { memo, useState } from "react";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
} from "recharts";
import { useQueryGetBalanceHistory } from "@/utils/generated/hooks";
import { ChartSkeleton } from "@/components/loading/Skeleton";
import { formatTickValue } from "@/utils/number-formatter";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrency } from "@/utils/currency-formatter";

interface AccountBalanceProps {
  availableYears?: number[];
}

export const AccountBalance = memo(function AccountBalance({
  availableYears = [new Date().getFullYear()],
}: AccountBalanceProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { currency } = useCurrency();

  // Fetch balance history for total balance (walletId: 0 = all wallets)
  const { data: balanceHistory, isLoading } = useQueryGetBalanceHistory(
    {
      walletId: 0,
      year: selectedYear,
      month: 0,
    },
    {
      refetchOnMount: "always",
    },
  );

  // Prepare chart data with gradient-like styling
  const chartData =
    balanceHistory?.data?.map((point) => ({
      label: point.label,
      balance: point.balance,
      income: point.income,
      expense: point.expense,
    })) ?? [];

  if (isLoading) {
    return (
      <div className="w-full aspect-video p-1">
        <ChartSkeleton />
      </div>
    );
  }

  return (
    <div className="w-full aspect-video p-1">
      <div className="text-sm">
        <select
          className="border-solid border rounded-md p-1 m-2"
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
        >
          {availableYears.map((year) => {
            return (
              <option key={year} value={year}>
                {year}
              </option>
            );
          })}
        </select>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 15, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis tickFormatter={formatTickValue} />
          <Tooltip
            formatter={(value: number | undefined, name?: string) => {
              // Format with dynamic currency
              const formatted = formatCurrency(value ?? 0, currency);
              return [formatted, name ?? ""];
            }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="balance"
            fill="#5579eb"
            fillOpacity={0.3}
            stroke="#5579eb"
            name="Total Balance"
          />
          <Line
            type="monotone"
            dataKey="income"
            stroke="#35d3ac"
            name="Income"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="expense"
            stroke="#ff7188"
            name="Expense"
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
});
