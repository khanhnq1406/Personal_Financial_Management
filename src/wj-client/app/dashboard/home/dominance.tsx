import { pieChartColors } from "@/app/constants";
import { memo, useState } from "react";
import { PieChart, ResponsiveContainer, Pie, Legend, Cell } from "recharts";
import { ChartSkeleton } from "@/components/loading/Skeleton";

type CustomizedLableType = {
  cx: number;
  cy: number;
  midAngle: number | string;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  index: number | string;
};
export const Dominance = memo(function Dominance() {
  const [isLoading] = useState(false);

  if (isLoading) {
    return (
      <div className="w-full aspect-video p-1">
        <ChartSkeleton />
      </div>
    );
  }

  const data = [
    { name: "Wallet 1", value: 10 },
    { name: "Wallet 2", value: 20 },
    { name: "Wallet 3", value: 30 },
  ];

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: CustomizedLableType) => {
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

  return (
    <div className="w-full aspect-video p-1">
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
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
});
