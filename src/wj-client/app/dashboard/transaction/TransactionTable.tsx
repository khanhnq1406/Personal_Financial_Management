"use client";

import Image from "next/image";
import { createColumnHelper } from "@tanstack/react-table";
import { TanStackTable } from "../../../components/table/TanStackTable";
import { resources } from "@/app/constants";
import { Transaction } from "@/gen/protobuf/v1/transaction";
import { currencyFormatter } from "@/utils/currencyFormatter";

interface TransactionTableProps {
  transactions: Transaction[];
  getCategoryName: (id: number) => string;
  onEdit: (transactionId: number) => void;
  onDelete: (transactionId: number) => void;
  isLoading?: boolean;
  className?: string;
}

export function TransactionTable({
  transactions,
  getCategoryName,
  onEdit,
  onDelete,
  isLoading = false,
  className,
}: TransactionTableProps) {
  const columnHelper = createColumnHelper<Transaction>();

  // Format date for display
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Define columns
  const columns = [
    columnHelper.accessor("categoryId", {
      id: "category",
      header: "Category",
      cell: (info) => getCategoryName(info.getValue()),
    }),
    columnHelper.accessor("amount", {
      id: "amount",
      header: "Amount",
      cell: (info) => currencyFormatter.format(info.getValue()?.amount || 0),
    }),
    columnHelper.accessor("date", {
      id: "date",
      header: "Date & Time",
      cell: (info) => formatDate(info.getValue()),
    }),
    columnHelper.accessor("note", {
      id: "note",
      header: "Note",
      cell: (info) => info.getValue() || "-",
    }),
    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: (info) => (
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(info.row.original.id)}
            className="w-6 h-6 hover:opacity-70 transition-opacity"
            aria-label="Edit transaction"
          >
            <Image
              src={`${resources}/editing.png`}
              width={24}
              height={24}
              alt="Edit transaction"
              className="w-full h-full object-contain"
            />
          </button>
          <button
            onClick={() => onDelete(info.row.original.id)}
            className="w-6 h-6 hover:opacity-70 transition-opacity"
            aria-label="Delete transaction"
          >
            <Image
              src={`${resources}/remove.png`}
              width={24}
              height={24}
              alt="Delete transaction"
              className="w-full h-full object-contain"
            />
          </button>
        </div>
      ),
    }),
  ];

  return (
    <TanStackTable
      data={transactions}
      columns={columns}
      emptyMessage="No transactions found"
      emptyDescription="Add your first transaction to get started"
      isLoading={isLoading}
      className={className}
    />
  );
}
