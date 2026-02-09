"use client";

import { pieChartColors } from "@/app/constants";
import { memo, useState } from "react";
import {
  PieChart,
  ResponsiveContainer,
  Pie,
  Legend,
  Cell,
  Tooltip,
} from "recharts";
import { useQueryListWallets } from "@/utils/generated/hooks";
import { ChartSkeleton } from "@/components/loading/Skeleton";
import { formatCurrency } from "@/utils/currency-formatter";
import { useCurrency } from "@/contexts/CurrencyContext";

type CustomizedLabelType = {
  cx?: number;
  cy?: number;
  midAngle?: number | string;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
  index?: number | string;
};

interface DominanceProps {
  availableYears: number[];
}

export const Dominance = memo(function Dominance({
  availableYears,
}: DominanceProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { currency } = useCurrency();

  // Fetch wallets for the dropdown
  const { data: walletsData, isLoading: walletsLoading } = useQueryListWallets(
    {
      pagination: { page: 1, pageSize: 100, orderBy: "", order: "" },
    },
    { refetchOnMount: "always" },
  );

  if (walletsLoading) {
    return (
      <div className="w-full aspect-video p-1">
        <ChartSkeleton />
      </div>
    );
  }

  // Prepare chart data - use display balances in user's preferred currency
  const data =
    walletsData?.wallets?.map((wallet) => ({
      name: wallet.walletName,
      value: wallet.displayBalance?.amount ?? wallet.balance?.amount ?? 0,
    })) ?? [];

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: CustomizedLabelType) => {
    const radius = (innerRadius ?? 0) + ((outerRadius ?? 0) - (innerRadius ?? 0)) * 0.45;
    const x = (cx ?? 0) + radius * Math.cos(-(typeof midAngle === "number" ? midAngle : 0) * RADIAN);
    const y = (cy ?? 0) + radius * Math.sin(-(typeof midAngle === "number" ? midAngle : 0) * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > (cx ?? 0) ? "start" : "end"}
        dominantBaseline="central"
        className="sm:text-base text-sm"
      >
        {`${((percent ?? 0) * 100).toFixed(0)}%`}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-2 border rounded shadow">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm">
            {formatCurrency(data.value, currency)}
          </p>
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
        <PieChart>
          <Legend />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            fill="#8884d8"
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={pieChartColors[index % pieChartColors.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
});
