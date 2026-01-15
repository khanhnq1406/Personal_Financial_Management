"use client";

import { pieChartColors } from "@/app/constants";
import { memo, useState } from "react";
import { PieChart, ResponsiveContainer, Pie, Legend, Cell, Tooltip } from "recharts";
import { useQueryListWallets } from "@/utils/generated/hooks";
import { ChartSkeleton } from "@/components/loading/Skeleton";

type CustomizedLabelType = {
  cx: number;
  cy: number;
  midAngle: number | string;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  index: number | string;
};

interface DominanceProps {
  availableYears: number[];
}

export const Dominance = memo(function Dominance({ availableYears }: DominanceProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Fetch wallets for the dropdown
  const { data: walletsData, isLoading: walletsLoading } = useQueryListWallets(
    {
      pagination: { page: 1, pageSize: 100, orderBy: "", order: "" },
    },
    { refetchOnMount: "always" }
  );

  if (walletsLoading) {
    return (
      <div className="w-full aspect-video p-1">
        <ChartSkeleton />
      </div>
    );
  }

  // Prepare chart data - use current wallet balances
  // For a true yearly dominance, we would need the balance at the end of the selected year
  const data =
    walletsData?.wallets?.map((wallet) => ({
      name: wallet.walletName,
      value: wallet.balance?.amount ?? 0,
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
    const radius = innerRadius + (outerRadius - innerRadius) * 0.45;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className="sm:text-base text-sm"
      >
        {`${(percent * 100).toFixed(0)}%`}
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
            {new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(data.value)}
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
      <ResponsiveContainer>
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
