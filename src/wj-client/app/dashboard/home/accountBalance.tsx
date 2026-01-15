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
} from "recharts";
import { ChartSkeleton } from "@/components/loading/Skeleton";

export const AccountBalance = memo(function AccountBalance() {
  const [isLoading] = useState(false);

  if (isLoading) {
    return (
      <div className="w-full aspect-video p-1">
        <ChartSkeleton />
      </div>
    );
  }

  const years = [2024, 2023];
  const data = [
    { id: 1, month: "January", balance: 100 },
    { id: 2, month: "February", balance: 200 },
    { id: 3, month: "March", balance: 150 },
    { id: 4, month: "April", balance: 300 },
    { id: 5, month: "May", balance: 200 },
    { id: 6, month: "June", balance: 450 },
    { id: 7, month: "July", balance: 500 },
    { id: 8, month: "August", balance: 800 },
    { id: 9, month: "September", balance: 770 },
    { id: 10, month: "October", balance: 900 },
    { id: 11, month: "November", balance: 1100 },
    { id: 12, month: "December", balance: 1200 },
  ];
  return (
    <div>
      <div className="w-full aspect-video p-1">
        <div className="text-sm">
          <select className="border-solid border rounded-md p-1 m-2">
            {years.map((year) => {
              return (
                <option key={year} value={year}>
                  {year}
                </option>
              );
            })}
          </select>
        </div>
        <ResponsiveContainer>
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" domain={["dataMin", "dataMax"]} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="balance"
              stroke="#5579eb"
              name="Total Balance"
              strokeWidth={2}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});
