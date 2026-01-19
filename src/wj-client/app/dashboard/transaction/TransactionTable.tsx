"use client";

import Image from "next/image";
import { createColumnHelper } from "@tanstack/react-table";
import { useMemo, useCallback, memo } from "react";
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

// Memoized action button component to prevent re-renders
const TransactionActions = memo(function TransactionActions({
  transactionId,
  onEdit,
  onDelete,
}: {
  transactionId: number;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const handleEdit = useCallback(() => {
    onEdit(transactionId);
  }, [transactionId, onEdit]);

  const handleDelete = useCallback(() => {
    onDelete(transactionId);
  }, [transactionId, onDelete]);

  return (
    <div className="flex gap-2">
      <button
        onClick={handleEdit}
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
        onClick={handleDelete}
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
  );
});

export const TransactionTable = memo(function TransactionTable({
  transactions,
  getCategoryName,
  onEdit,
  onDelete,
  isLoading = false,
  className,
}: TransactionTableProps) {
  const columnHelper = createColumnHelper<Transaction>();

  // Memoize date formatter to avoid recreating on every render
  const formatDate = useCallback((timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  // Memoize columns to avoid recreating on every render
  const columns = useMemo(() => [
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
        <TransactionActions
          transactionId={info.row.original.id}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ),
    }),
  ], [columnHelper, getCategoryName, formatDate, onEdit, onDelete]);

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
});
