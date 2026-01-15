import { memo, useState } from "react";
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
export const MonthlyDominance = memo(function MonthlyDominance() {
  const [isLoading] = useState(false);

  if (isLoading) {
    return (
      <div className=" w-full aspect-video p-1">
        <ChartSkeleton />
      </div>
    );
  }

  const data = [
    {
      month: "Jan",
      wallet1: 1000,
      wallet2: 2000,
      wallet3: 3000,
    },
    {
      month: "Feb",
      wallet1: 1200,
      wallet2: 2200,
      wallet3: 3200,
    },
    {
      month: "Mar",
      wallet1: 1400,
      wallet2: 2400,
      wallet3: 3400,
    },
  ];
  return (
    <div className="w-full aspect-video p-1">
      <ResponsiveContainer>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="month" />
          <YAxis />
          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="wallet1"
            stroke="#8884d8"
            fillOpacity={1}
            fill="url(#colorUv)"
          />
          <Area
            type="monotone"
            dataKey="wallet2"
            stroke="#8884d8"
            fillOpacity={1}
            fill="url(#colorUv)"
          />
          <Area
            type="monotone"
            dataKey="wallet3"
            stroke="#8884d8"
            fillOpacity={1}
            fill="url(#colorUv)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});
