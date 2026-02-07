"use client";

import { memo, useState, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
  CartesianGrid,
  YAxis,
  XAxis,
} from "recharts";
import { ChartSkeleton } from "@/components/loading/Skeleton";
import { useQueryGetMonthlyDominance } from "@/utils/generated/hooks";
import { chartColors } from "@/app/constants";
import { formatTickValue } from "@/utils/number-formatter";
import { formatCurrency } from "@/utils/currency-formatter";
import { useCurrency } from "@/contexts/CurrencyContext";

interface MonthlyDominanceProps {
  availableYears: number[];
}

export const MonthlyDominance = memo(function MonthlyDominance({
  availableYears,
}: MonthlyDominanceProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { currency } = useCurrency();

  // Fetch monthly dominance data for the selected year
  const { data: dominanceData, isLoading } = useQueryGetMonthlyDominance(
    { year: selectedYear },
    { refetchOnMount: "always" },
  );

  // Transform data into stacked area chart format
  const chartData = useMemo(() => {
    const walletData = dominanceData?.data ?? [];
    if (walletData.length === 0) return [];

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    // Build monthly data with each wallet's balance
    const monthlyData: Record<string, any>[] = monthNames.map((month) => ({
      month,
    }));

    walletData.forEach((wallet) => {
      wallet.monthlyBalances.forEach((balance: number, monthIndex: number) => {
        monthlyData[monthIndex][`wallet_${wallet.walletId}`] = balance;
        monthlyData[monthIndex][`wallet_name_${wallet.walletId}`] =
          wallet.walletName;
      });
    });

    return monthlyData;
  }, [dominanceData]);

  // Get wallet list from data
  const wallets = useMemo(() => dominanceData?.data ?? [], [dominanceData]);

  // Generate unique gradient IDs for each wallet
  const gradients = useMemo(
    () =>
      wallets.map((wallet) => {
        const color = chartColors[wallets.indexOf(wallet) % chartColors.length];
        return {
          id: `color${wallet.walletId}`,
          color,
        };
      }),
    [wallets],
  );

  if (isLoading) {
    return (
      <div className="w-full aspect-video p-1">
        <ChartSkeleton />
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow">
          <p className="font-semibold">{payload[0].payload.month}</p>
          {payload.map((entry: any, index: number) => {
            const walletId = entry.dataKey.replace("wallet_", "");
            const walletName = entry.payload[`wallet_name_${walletId}`];
            return (
              <p key={index} className="text-sm" style={{ color: entry.color }}>
                {walletName}: {formatCurrency(entry.value, currency)}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

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
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 15, bottom: 0 }}
        >
          <defs>
            {gradients.map((grad) => (
              <linearGradient
                key={grad.id}
                id={grad.id}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={grad.color} stopOpacity={0.8} />
                <stop offset="95%" stopColor={grad.color} stopOpacity={0.1} />
              </linearGradient>
            ))}
          </defs>
          <XAxis dataKey="month" />
          <YAxis tickFormatter={formatTickValue} />
          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip content={<CustomTooltip />} />
          {wallets.map((wallet, index) => (
            <Area
              key={wallet.walletId}
              type="monotone"
              dataKey={`wallet_${wallet.walletId}`}
              stackId="1"
              stroke={chartColors[index % chartColors.length]}
              fillOpacity={1}
              fill={`url(#color${wallet.walletId})`}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});
