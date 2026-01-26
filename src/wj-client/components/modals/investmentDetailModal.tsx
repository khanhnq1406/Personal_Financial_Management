"use client";

import React, { useState, useEffect } from "react";
import { BaseModal } from "@/components/modals/BaseModal";
import { Button } from "@/components/Button";
import { ButtonType } from "@/app/constants";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import {
  useQueryGetInvestment,
  useQueryListInvestmentTransactions,
  useMutationAddInvestmentTransaction,
  EVENT_InvestmentGetInvestment,
  EVENT_InvestmentListInvestmentTransactions,
} from "@/utils/generated/hooks";
import { InvestmentTransactionType } from "@/gen/protobuf/v1/investment";
import type { AddTransactionRequest } from "@/gen/protobuf/v1/investment";

export interface InvestmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  investmentId: number;
  onSuccess?: () => void;
}

// Formatting helpers
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount / 100); // Convert from cents to dollars
};

const formatQuantity = (quantity: number, decimals: number = 4): string => {
  return (quantity / Math.pow(10, decimals)).toFixed(decimals);
};

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
    { investmentId: investmentId, pagination: { page: 1, pageSize: 100, orderBy: "", order: "" }, typeFilter: 0 },
    {
      enabled: isOpen && !!investmentId && activeTab === "transactions",
      refetchOnMount: "always",
    },
  );

  // Add transaction mutation
  const addTransactionMutation = useMutationAddInvestmentTransaction({
    onSuccess: () => {
      onSuccess?.();
      getInvestment.refetch();
      setActiveTab("overview");
      onClose();
    },
    onError: (error: any) => {
      setFormError(error.message || "Failed to add transaction");
    },
  });

  // Form state
  const [transactionType, setTransactionType] =
    useState<InvestmentTransactionType>(
      InvestmentTransactionType.INVESTMENT_TRANSACTION_TYPE_BUY,
    );
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [fees, setFees] = useState("0");
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [formError, setFormError] = useState("");

  // Reset form when tab changes
  useEffect(() => {
    if (activeTab === "add-transaction") {
      setTransactionType(
        InvestmentTransactionType.INVESTMENT_TRANSACTION_TYPE_BUY,
      );
      setQuantity("");
      setPrice("0");
      setFees("0");
      setTransactionDate(new Date().toISOString().split("T")[0]);
      setFormError("");
    }
  }, [activeTab]);

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    // Validation
    const qtyNum = parseFloat(quantity);
    const priceNum = parseFloat(price);
    const feesNum = parseFloat(fees);

    if (isNaN(qtyNum) || qtyNum <= 0) {
      setFormError("Please enter a valid quantity");
      return;
    }

    if (isNaN(priceNum) || priceNum < 0) {
      setFormError("Please enter a valid price");
      return;
    }

    if (isNaN(feesNum) || feesNum < 0) {
      setFormError("Please enter valid fees");
      return;
    }

    if (!transactionDate) {
      setFormError("Please select a transaction date");
      return;
    }

    // Convert to API format (cents for currency, smallest unit for quantity)
    const investment = getInvestment.data?.data;
    if (!investment) return;

    // Determine decimals based on investment type
    let decimals = 4;
    if (
      investment.type ===
      InvestmentTransactionType.INVESTMENT_TRANSACTION_TYPE_BUY
    ) {
      decimals = 8;
    }

    const request: AddTransactionRequest = {
      investmentId: investmentId,
      type: transactionType,
      quantity: Math.round(qtyNum * Math.pow(10, decimals)),
      price: Math.round(priceNum * 100), // Convert to cents
      fees: Math.round(feesNum * 100), // Convert to cents
      transactionDate: Math.floor(
        new Date(transactionDate).getTime() / 1000,
      ),
      notes: "",
    };

    addTransactionMutation.mutate(request);
  };

  const investment = getInvestment.data?.data;
  const transactions = getListInvestmentTransactions.data?.data || [];

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Investment Details">
      {getInvestment.isLoading || getInvestment.isPending ? (
        <div className="flex items-center justify-center h-48">
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
                  {formatQuantity(investment.quantity, 4)}
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
            <div className="space-y-3">
              {getListInvestmentTransactions.isLoading ||
              getListInvestmentTransactions.isPending ? (
                <div className="flex items-center justify-center h-48">
                  <LoadingSpinner text="Loading transactions..." />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No transactions yet.</p>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-2">Type</th>
                        <th className="text-right py-2">Quantity</th>
                        <th className="text-right py-2">Price</th>
                        <th className="text-right py-2">Fees</th>
                        <th className="text-right py-2">Total</th>
                        <th className="text-left py-2">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="border-b border-gray-100">
                          <td
                            className={`py-2 font-medium ${
                              tx.type ===
                              InvestmentTransactionType.INVESTMENT_TRANSACTION_TYPE_BUY
                                ? "text-green-600"
                                : tx.type ===
                                  InvestmentTransactionType.INVESTMENT_TRANSACTION_TYPE_SELL
                                ? "text-red-600"
                                : "text-blue-600"
                            }`}
                          >
                            {getTransactionTypeLabel(tx.type)}
                          </td>
                          <td className="py-2 text-right">
                            {formatQuantity(tx.quantity, 4)}
                          </td>
                          <td className="py-2 text-right">
                            {formatCurrency(tx.price || 0)}
                          </td>
                          <td className="py-2 text-right">
                            {formatCurrency(tx.fees || 0)}
                          </td>
                          <td className="py-2 text-right font-medium">
                            {formatCurrency(tx.cost || 0)}
                          </td>
                          <td className="py-2">
                            {formatDate(tx.transactionDate || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Add Transaction Tab */}
          {activeTab === "add-transaction" && (
            <form onSubmit={handleAddTransaction} className="space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction Type
                </label>
                <select
                  value={transactionType}
                  onChange={(e) =>
                    setTransactionType(
                      Number(e.target.value) as InvestmentTransactionType,
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-hgreen"
                  required
                >
                  <option value={InvestmentTransactionType.INVESTMENT_TRANSACTION_TYPE_BUY}>
                    Buy
                  </option>
                  <option value={InvestmentTransactionType.INVESTMENT_TRANSACTION_TYPE_SELL}>
                    Sell
                  </option>
                  <option value={InvestmentTransactionType.INVESTMENT_TRANSACTION_TYPE_DIVIDEND}>
                    Dividend
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  step="0.00000001"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-hgreen"
                  placeholder="0.00000000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price per Unit (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-hgreen"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fees (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={fees}
                  onChange={(e) => setFees(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-hgreen"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction Date
                </label>
                <input
                  type="date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-hgreen"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type={ButtonType.SECONDARY}
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type={ButtonType.PRIMARY}
                  onClick={handleAddTransaction}
                  loading={addTransactionMutation.isPending}
                  className="flex-1"
                >
                  Add Transaction
                </Button>
              </div>
            </form>
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
