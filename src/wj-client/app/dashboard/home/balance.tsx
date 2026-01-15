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
  Bar,
} from "recharts";
import {
  useQueryGetBalanceHistory,
  useQueryListWallets,
  useQueryGetAvailableYears,
} from "@/utils/generated/hooks";
import { ChartSkeleton } from "@/components/loading/Skeleton";

export const Balance = memo(function Balance() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedWalletId, setSelectedWalletId] = useState<number | undefined>(
    undefined
  );

  // Fetch wallets for the dropdown
  const { data: walletsData, isLoading: walletsLoading } = useQueryListWallets(
    {
      pagination: { page: 1, pageSize: 100, orderBy: "", order: "" },
    },
    { refetchOnMount: "always" }
  );

  // Fetch available years from user's transactions
  const { data: availableYearsData } = useQueryGetAvailableYears({}, { refetchOnMount: "always" });

  // Fetch balance history
  const { data: balanceHistory, isLoading: balanceLoading } =
    useQueryGetBalanceHistory(
      {
        walletId: selectedWalletId ?? 0,
        year: selectedYear,
        month: 0,
      },
      {
        refetchOnMount: "always",
        enabled: !walletsLoading,
      }
    );

  // Prepare chart data
  const chartData =
    balanceHistory?.data?.map((point) => ({
      label: point.label,
      balance: point.balance,
      income: point.income,
      expense: point.expense,
    })) ?? [];

  // Use available years from API, or default to current year if no transactions
  const years = availableYearsData?.years?.length ? availableYearsData.years : [new Date().getFullYear()];

  if (walletsLoading || balanceLoading) {
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
          {years.map((year) => {
            return (
              <option key={year} value={year}>
                {year}
              </option>
            );
          })}
        </select>
        <select
          className="border-solid border rounded-md p-1"
          value={selectedWalletId ?? ""}
          onChange={(e) =>
            setSelectedWalletId(
              e.target.value ? parseInt(e.target.value) : undefined
            )
          }
        >
          <option value="">All Wallets</option>
          {walletsData?.wallets?.map((wallet) => {
            return (
              <option key={wallet.id} value={wallet.id}>
                {wallet.walletName}
              </option>
            );
          })}
        </select>
      </div>
      <ResponsiveContainer>
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis
            tickFormatter={(value) => {
              if (value >= 1_000_000_000)
                return `${(value / 1_000_000_000).toFixed(1)}B`;
              if (value >= 1_000_000)
                return `${(value / 1_000_000).toFixed(1)}M`;
              if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
              return `${value}`;
            }}
          />
          <Tooltip
            formatter={(value: number) => {
              // Format as VND
              return new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(value);
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="balance"
            stroke="#5579eb"
            name="Total Balance"
            strokeWidth={2}
          />
          <Bar dataKey="income" fill="#35d3ac" name="Income" />
          <Bar dataKey="expense" fill="#ff7188" name="Expense" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
});
