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
} from "@/utils/generated/hooks";
import { ChartSkeleton } from "@/components/loading/Skeleton";
import { formatTickValue } from "@/utils/number-formatter";
import { formatCurrency } from "@/utils/currency-formatter";
import { useCurrency } from "@/contexts/CurrencyContext";

interface BalanceProps {
  availableYears: number[];
}

export const Balance = memo(function Balance({ availableYears }: BalanceProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedWalletId, setSelectedWalletId] = useState<number | undefined>(
    undefined,
  );
  const { currency } = useCurrency();

  // Fetch wallets for the dropdown
  const { data: walletsData, isLoading: walletsLoading } = useQueryListWallets(
    {
      pagination: { page: 1, pageSize: 100, orderBy: "", order: "" },
    },
    { refetchOnMount: "always" },
  );

  // Fetch balance history - run in parallel with wallets query (async-parallel optimization)
  const { data: balanceHistory, isLoading: balanceLoading } =
    useQueryGetBalanceHistory(
      {
        walletId: selectedWalletId ?? 0,
        year: selectedYear,
        month: 0,
      },
      {
        refetchOnMount: "always",
      },
    );

  // Prepare chart data
  const chartData =
    balanceHistory?.data?.map((point) => ({
      label: point.label,
      balance: point.balance,
      income: point.income,
      expense: point.expense,
    })) ?? [];

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
          {availableYears.map((year) => {
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
              e.target.value ? parseInt(e.target.value) : undefined,
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
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 15, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis tickFormatter={formatTickValue} />
          <Tooltip
            formatter={(value: number) => formatCurrency(value, currency)}
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
