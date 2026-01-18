"use client";

import { Transaction, CategoryType } from "@/gen/protobuf/v1/transaction";
import { resources, ButtonType, ModalType } from "@/app/constants";
import { Button } from "@/components/Button";
import Image from "next/image";
import { store } from "@/redux/store";
import { openModal } from "@/redux/actions";
import { formatDateTime } from "@/lib/utils/date";
import { currencyFormatter } from "@/utils/currencyFormatter";

type TransactionItemProps = {
  transaction: Transaction;
  categoryTypeMap: Map<number, CategoryType>;
  onDelete: (request: { transactionId: number }) => void;
};

export const TransactionItem = ({
  transaction,
  categoryTypeMap,
  onDelete,
}: TransactionItemProps) => {
  const amount = transaction.amount?.amount || 0;

  // Determine if this is income or expense based on category type
  const categoryType = transaction.categoryId
    ? categoryTypeMap.get(transaction.categoryId)
    : undefined;

  const isIncome = categoryType === CategoryType.CATEGORY_TYPE_INCOME;

  const handleEdit = () => {
    store.dispatch(
      openModal({
        isOpen: true,
        type: ModalType.EDIT_TRANSACTION,
        transactionId: transaction.id,
        onSuccess: () => {
          // This will be handled by the parent component's refetch
        },
      })
    );
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      onDelete({ transactionId: transaction.id });
    }
  };

  return (
    <div className="flex items-center justify-between px-3 py-3 hover:bg-gray-50 rounded-lg transition-colors">
      {/* Left side - Icon and details */}
      <div className="flex items-center gap-3 flex-1">
        {/* Category Icon */}
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isIncome ? "bg-green-100" : "bg-red-100"
          }`}
        >
          <Image
            width={24}
            height={24}
            alt="category-icon"
            src={`${resources}${isIncome ? "income.png" : "expense.png"}`}
          />
        </div>

        {/* Transaction Details */}
        <div className="flex-1 min-w-0">
          {/* Category Name - using note as fallback */}
          <div className="font-medium text-gray-900 truncate">
            {transaction.note || "Transaction"}
          </div>
          {/* Date and Note */}
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <span>{formatDateTime(transaction.date)}</span>
            {transaction.note && (
              <>
                <span>•</span>
                <span className="truncate max-w-[200px]">{transaction.note}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right side - Amount and Actions */}
      <div className="flex items-center gap-3">
        {/* Amount */}
        <div
          className={`font-semibold text-lg ${
            isIncome ? "text-green-600" : "text-red-600"
          }`}
        >
          {isIncome ? "+" : "-"}
          {currencyFormatter.format(Math.abs(amount))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-1">
          <Button
            type={ButtonType.IMG}
            src={`${resources}edit.png`}
            onClick={handleEdit}
          />
          <Button
            type={ButtonType.IMG}
            src={`${resources}delete.png`}
            onClick={handleDelete}
          />
        </div>
      </div>
    </div>
  );
};
