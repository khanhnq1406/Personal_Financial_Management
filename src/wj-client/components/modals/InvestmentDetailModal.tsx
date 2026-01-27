"use client";

import { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { BaseModal } from "@/components/modals/BaseModal";
import { Button } from "@/components/Button";
import { ButtonType } from "@/app/constants";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { TanStackTable } from "@/components/table/TanStackTable";
import {
  useQueryGetInvestment,
  useQueryListInvestmentTransactions,
} from "@/utils/generated/hooks";
import { InvestmentTransactionType } from "@/gen/protobuf/v1/investment";
import { AddInvestmentTransactionForm } from "@/components/modals/forms/AddInvestmentTransactionForm";
import { formatCurrency, formatQuantity } from "@/lib/utils/units";

export interface InvestmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  investmentId: number;
  onSuccess?: () => void;
}

const formatDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getTransactionTypeLabel = (type: InvestmentTransactionType): string => {
  switch (type) {
    case InvestmentTransactionType.INVESTMENT_TRANSACTION_TYPE_BUY:
      return "Buy";
    case InvestmentTransactionType.INVESTMENT_TRANSACTION_TYPE_SELL:
      return "Sell";
    case InvestmentTransactionType.INVESTMENT_TRANSACTION_TYPE_DIVIDEND:
      return "Dividend";
    case InvestmentTransactionType.INVESTMENT_TRANSACTION_TYPE_SPLIT:
      return "Split";
    default:
      return "Unknown";
  }
};

type TabType = "overview" | "transactions" | "add-transaction";

type Transaction = {
  id: number;
  type: InvestmentTransactionType;
  quantity: number;
  price: number;
  fees: number;
  cost: number;
  transactionDate: number;
};

export function InvestmentDetailModal({
  isOpen,
  onClose,
  investmentId,
  onSuccess,
}: InvestmentDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  // Fetch investment details
  const getInvestment = useQueryGetInvestment(
    { id: investmentId },
    {
      enabled: isOpen && !!investmentId,
      refetchOnMount: "always",
    },
  );

  // Fetch investment transactions
  const getListInvestmentTransactions = useQueryListInvestmentTransactions(
    {
      investmentId: investmentId,
      pagination: { page: 1, pageSize: 100, orderBy: "", order: "" },
      typeFilter: 0,
    },
    {
      enabled: isOpen && !!investmentId && activeTab === "transactions",
      refetchOnMount: "always",
    },
  );

  const investment = getInvestment.data?.data;
  const transactions = getListInvestmentTransactions.data?.data || [];

  // Define table columns using ColumnDef
  const columns: ColumnDef<Transaction>[] = useMemo(
    () => [
      {
        id: "type",
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => {
          const type = row.original.type;
          return (
            <span
              className={`font-medium ${
                type ===
                InvestmentTransactionType.INVESTMENT_TRANSACTION_TYPE_BUY
                  ? "text-green-600"
                  : type ===
                      InvestmentTransactionType.INVESTMENT_TRANSACTION_TYPE_SELL
                    ? "text-red-600"
                    : "text-blue-600"
              }`}
            >
              {getTransactionTypeLabel(type)}
            </span>
          );
        },
      },
      {
        id: "quantity",
        accessorKey: "quantity",
        header: "Quantity",
        cell: ({ row }) =>
          formatQuantity(row.original.quantity, investment?.type || 0),
      },
      {
        id: "price",
        accessorKey: "price",
        header: "Price",
        cell: ({ row }) => formatCurrency(row.original.price || 0),
      },
      {
        id: "fees",
        accessorKey: "fees",
        header: "Fees",
        cell: ({ row }) => formatCurrency(row.original.fees || 0),
      },
      {
        id: "cost",
        accessorKey: "cost",
        header: "Total",
        cell: ({ row }) => (
          <span className="font-medium">
            {formatCurrency(row.original.cost || 0)}
          </span>
        ),
      },
      {
        id: "transactionDate",
        accessorKey: "transactionDate",
        header: "Date",
        cell: ({ row }) => formatDate(row.original.transactionDate || 0),
      },
    ],
    [investment?.type],
  );

  // Handle successful transaction addition
  const handleTransactionSuccess = () => {
    onSuccess?.();
    getInvestment.refetch();
    getListInvestmentTransactions.refetch();
    setActiveTab("overview");
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Investment Details"
      maxWidth="max-w-[50vw]"
    >
      {getInvestment.isLoading || getInvestment.isPending ? (
        <div className="flex items-center justify-center h-48 ">
          <LoadingSpinner text="Loading investment details..." />
        </div>
      ) : investment ? (
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 font-medium ${
                activeTab === "overview"
                  ? "border-b-2 border-hgreen text-hgreen"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("transactions")}
              className={`px-4 py-2 font-medium ${
                activeTab === "transactions"
                  ? "border-b-2 border-hgreen text-hgreen"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => setActiveTab("add-transaction")}
              className={`px-4 py-2 font-medium ${
                activeTab === "add-transaction"
                  ? "border-b-2 border-hgreen text-hgreen"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Add Transaction
            </button>
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Symbol</span>
                <span className="font-semibold">{investment.symbol}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Name</span>
                <span>{investment.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Quantity</span>
                <span className="font-medium">
                  {formatQuantity(investment.quantity, investment.type)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Avg Cost</span>
                <span>{formatCurrency(investment.averageCost || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Current Price</span>
                <span>{formatCurrency(investment.currentPrice || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Cost</span>
                <span>{formatCurrency(investment.totalCost || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Current Value</span>
                <span className="font-semibold">
                  {formatCurrency(investment.currentValue || 0)}
                </span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Unrealized PNL</span>
                  <span
                    className={`font-semibold ${
                      (investment.unrealizedPnl || 0) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(investment.unrealizedPnl || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Unrealized PNL %</span>
                  <span
                    className={`font-semibold ${
                      (investment.unrealizedPnlPercent || 0) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {investment.unrealizedPnlPercent >= 0 ? "+" : ""}
                    {investment.unrealizedPnlPercent?.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Realized PNL</span>
                  <span
                    className={`font-semibold ${
                      (investment.realizedPnl || 0) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(investment.realizedPnl || 0)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === "transactions" && (
            <div className="overflow-y-auto">
              <TanStackTable
                data={transactions}
                columns={columns}
                isLoading={
                  getListInvestmentTransactions.isLoading ||
                  getListInvestmentTransactions.isPending
                }
                emptyMessage="No transactions yet."
                emptyDescription=""
                className="text-sm"
              />
            </div>
          )}

          {/* Add Transaction Tab */}
          {activeTab === "add-transaction" && investment && (
            <AddInvestmentTransactionForm
              investmentId={investmentId}
              investmentType={investment.type}
              onSuccess={handleTransactionSuccess}
            />
          )}

          {/* Close button for overview and transactions tabs */}
          {activeTab !== "add-transaction" && (
            <div className="pt-4">
              <Button type={ButtonType.PRIMARY} onClick={onClose}>
                Close
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-lred">Investment not found</div>
      )}
    </BaseModal>
  );
}
