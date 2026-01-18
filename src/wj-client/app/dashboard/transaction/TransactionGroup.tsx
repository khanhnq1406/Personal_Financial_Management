"use client";

import { Transaction, CategoryType } from "@/gen/protobuf/v1/transaction";
import { TransactionItem } from "./TransactionItem";
import { formatDateFriendly } from "@/lib/utils/transaction";

type TransactionGroupProps = {
  date: string;
  transactions: Transaction[];
  categoryTypeMap: Map<number, CategoryType>;
  onDelete: (request: { transactionId: number }) => void;
};

export const TransactionGroup = ({
  date,
  transactions,
  categoryTypeMap,
  onDelete,
}: TransactionGroupProps) => {
  // Calculate daily total
  const dailyTotal = transactions.reduce((total, transaction) => {
    const amount = transaction.amount?.amount || 0;
    const categoryType = transaction.categoryId
      ? categoryTypeMap.get(transaction.categoryId)
      : undefined;

    // Subtract expenses, add income
    if (categoryType === CategoryType.CATEGORY_TYPE_EXPENSE) {
      return total - Math.abs(amount);
    } else {
      return total + Math.abs(amount);
    }
  }, 0);

  return (
    <div>
      {/* Date Header */}
      <div className="flex justify-between items-center mb-2 px-3">
        <div className="font-semibold text-gray-700">
          {formatDateFriendly(date)}
        </div>
        <div
          className={`font-semibold ${
            dailyTotal >= 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          {dailyTotal >= 0 ? "+" : ""}
          {Math.abs(dailyTotal).toLocaleString()} VND
        </div>
      </div>

      {/* Transactions */}
      <div className="space-y-1">
        {transactions.map((transaction) => (
          <TransactionItem
            key={transaction.id}
            transaction={transaction}
            categoryTypeMap={categoryTypeMap}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
};
