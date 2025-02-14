import { memo } from "react";
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

export const Balance = memo(function Balance() {
  const years = [2024, 2023];
  const wallets = ["Wallet 1", "Wallet 2", "Wallet 3"];
  const generateRandomYearData = () => {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    let currentBalance = Math.floor(Math.random() * 10000);

    return months.map((month, index) => {
      const id = index + 1;
      const randomIncome = Math.floor(Math.random() * 5000);
      const randomExpense = Math.floor(Math.random() * 4000);

      currentBalance += randomIncome;
      currentBalance -= randomExpense;

      return {
        id,
        month,
        balance: currentBalance,
        income: randomIncome,
        expense: randomExpense,
      };
    });
  };

  const balance = generateRandomYearData();
  return (
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
        <select className="border-solid border rounded-md p-1">
          {wallets.map((wallet) => {
            return (
              <option key={wallet} value={wallet}>
                {wallet}
              </option>
            );
          })}
        </select>
      </div>
      <ResponsiveContainer>
        <ComposedChart
          data={balance}
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
          <Bar dataKey="income" fill="#35d3ac" name="Income" />
          <Bar dataKey="expense" fill="#ff7188" name="Expense" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
});
