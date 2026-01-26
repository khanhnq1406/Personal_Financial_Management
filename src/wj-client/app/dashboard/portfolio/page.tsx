"use client";

import React, { useState, useMemo } from "react";
import { BaseCard } from "@/components/BaseCard";
import { Button, ButtonType } from "@/components/Button";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import {
  useQueryListWallets,
  useQueryGetPortfolioSummary,
  useQueryListInvestments,
  EVENT_WalletListWallets,
  EVENT_InvestmentGetPortfolioSummary,
  EVENT_InvestmentListInvestments,
} from "@/utils/generated/hooks";
import { WalletType } from "@/gen/protobuf/v1/wallet";
import { InvestmentType } from "@/gen/protobuf/v1/investment";
import { store } from "@/redux/store";
import { openModal } from "@/redux/actions";
import { ModalType } from "@/app/constants";

// Formatting helpers
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount / 100); // Convert from cents to dollars
};

const formatQuantity = (quantity: number, type: InvestmentType): string => {
  // Crypto: 8 decimals, Stocks/ETFs/Mutual Funds: 4 decimals, Bonds/Commodities: 2 decimals
  let decimals = 2;
  if (type === InvestmentType.INVESTMENT_TYPE_CRYPTOCURRENCY) {
    decimals = 8;
  } else if (
    type === InvestmentType.INVESTMENT_TYPE_STOCK ||
    type === InvestmentType.INVESTMENT_TYPE_ETF ||
    type === InvestmentType.INVESTMENT_TYPE_MUTUAL_FUND
  ) {
    decimals = 4;
  }
  return (quantity / Math.pow(10, decimals)).toFixed(decimals);
};

const formatPercent = (value: number): string => {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
};

const getInvestmentTypeLabel = (type: InvestmentType): string => {
  switch (type) {
    case InvestmentType.INVESTMENT_TYPE_CRYPTOCURRENCY:
      return "Crypto";
    case InvestmentType.INVESTMENT_TYPE_STOCK:
      return "Stock";
    case InvestmentType.INVESTMENT_TYPE_ETF:
      return "ETF";
    case InvestmentType.INVESTMENT_TYPE_MUTUAL_FUND:
      return "Mutual Fund";
    case InvestmentType.INVESTMENT_TYPE_BOND:
      return "Bond";
    case InvestmentType.INVESTMENT_TYPE_COMMODITY:
      return "Commodity";
    case InvestmentType.INVESTMENT_TYPE_OTHER:
      return "Other";
    default:
      return "Unknown";
  }
};

export default function PortfolioPage() {
  const [selectedWalletId, setSelectedWalletId] = useState<number | null>(null);

  // Fetch user's wallets
  const getListWallets = useQueryListWallets(
    {
      pagination: { page: 1, pageSize: 100, orderBy: "created_at", order: "desc" },
    },
    { refetchOnMount: "always" },
  );

  // Filter for investment wallets
  const investmentWallets = useMemo(() => {
    if (!getListWallets.data?.wallets) return [];
    return getListWallets.data.wallets.filter(
      (wallet) => wallet.type === WalletType.INVESTMENT,
    );
  }, [getListWallets.data]);

  // Set default wallet if none selected
  React.useEffect(() => {
    if (!selectedWalletId && investmentWallets.length > 0) {
      setSelectedWalletId(investmentWallets[0].id);
    }
  }, [selectedWalletId, investmentWallets]);

  // Fetch portfolio summary for selected wallet
  const getPortfolioSummary = useQueryGetPortfolioSummary(
    { walletId: selectedWalletId || 0 },
    {
      enabled: !!selectedWalletId,
      refetchOnMount: "always",
    },
  );

  // Fetch investments for selected wallet
  const getListInvestments = useQueryListInvestments(
    {
      walletId: selectedWalletId || 0,
      pagination: { page: 1, pageSize: 100, orderBy: "symbol", order: "asc" },
    },
    {
      enabled: !!selectedWalletId,
      refetchOnMount: "always",
    },
  );

  const handleAddInvestment = () => {
    if (!selectedWalletId) return;
    store.dispatch(
      openModal({
        isOpen: true,
        type: ModalType.ADD_INVESTMENT,
        walletId: selectedWalletId,
        onSuccess: () => {
          // Refetch data
          getListWallets.refetch();
          getPortfolioSummary.refetch();
          getListInvestments.refetch();
        },
      }),
    );
  };

  const handleInvestmentClick = (investmentId: number) => {
    store.dispatch(
      openModal({
        isOpen: true,
        type: ModalType.INVESTMENT_DETAIL,
        investmentId: investmentId,
        onSuccess: () => {
          getListWallets.refetch();
          getPortfolioSummary.refetch();
          getListInvestments.refetch();
        },
      }),
    );
  };

  // Loading state
  if (getListWallets.isLoading || getListWallets.isPending) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner text="Loading portfolio..." />
      </div>
    );
  }

  // Error state
  if (getListWallets.error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lred text-center">
          <p className="text-lg font-semibold">Error loading portfolio</p>
          <p className="text-sm">{getListWallets.error.message}</p>
        </div>
      </div>
    );
  }

  // No investment wallets
  if (investmentWallets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700">No Investment Wallets</p>
          <p className="text-sm text-gray-500 mt-2">
            Create an investment wallet to start tracking your portfolio
          </p>
        </div>
        <Button
          type={ButtonType.PRIMARY}
          onClick={() => {
            store.dispatch(
              openModal({
                isOpen: true,
                type: ModalType.CREATE_WALLET,
                onSuccess: () => getListWallets.refetch(),
              }),
            );
          }}
        >
          Create Investment Wallet
        </Button>
      </div>
    );
  }

  const portfolioSummary = getPortfolioSummary.data;
  const investments = getListInvestments.data?.data || [];

  return (
    <div className="flex justify-center py-2">
      <div className="w-[80%] space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Investment Portfolio</h1>

          {/* Wallet Selector */}
          {investmentWallets.length > 1 && (
            <select
              value={selectedWalletId || ""}
              onChange={(e) => setSelectedWalletId(Number(e.target.value))}
              className="px-4 py-2 border-2 border-hgreen rounded-md focus:outline-none focus:ring-2 focus:ring-hgreen"
            >
              {investmentWallets.map((wallet) => (
                <option key={wallet.id} value={wallet.id}>
                  {wallet.walletName}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Portfolio Summary Cards */}
        {getPortfolioSummary.isLoading || getPortfolioSummary.isPending ? (
          <div className="flex items-center justify-center h-48">
            <LoadingSpinner text="Loading summary..." />
          </div>
        ) : portfolioSummary ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <BaseCard className="p-4">
              <div className="text-sm text-gray-600">Total Value</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(portfolioSummary.totalValue || 0)}
              </div>
            </BaseCard>

            <BaseCard className="p-4">
              <div className="text-sm text-gray-600">Total Cost</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(portfolioSummary.totalCost || 0)}
              </div>
            </BaseCard>

            <BaseCard className="p-4">
              <div className="text-sm text-gray-600">Total PNL</div>
              <div
                className={`text-2xl font-bold mt-1 ${
                  (portfolioSummary.totalPnl || 0) >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {formatCurrency(portfolioSummary.totalPnl || 0)}
              </div>
            </BaseCard>

            <BaseCard className="p-4">
              <div className="text-sm text-gray-600">Holdings</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {portfolioSummary.totalInvestments || 0}
              </div>
            </BaseCard>
          </div>
        ) : null}

        {/* Holdings Table */}
        <BaseCard className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Holdings</h2>
            <Button
              type={ButtonType.PRIMARY}
              onClick={handleAddInvestment}
              disabled={!selectedWalletId}
              className="w-auto px-4"
            >
              Add Investment
            </Button>
          </div>

          {getListInvestments.isLoading || getListInvestments.isPending ? (
            <div className="flex items-center justify-center h-48">
              <LoadingSpinner text="Loading holdings..." />
            </div>
          ) : investments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No investments yet. Add your first investment to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-2 px-2">Symbol</th>
                    <th className="text-left py-2 px-2">Name</th>
                    <th className="text-left py-2 px-2">Type</th>
                    <th className="text-right py-2 px-2">Quantity</th>
                    <th className="text-right py-2 px-2">Avg Cost</th>
                    <th className="text-right py-2 px-2">Current Price</th>
                    <th className="text-right py-2 px-2">Current Value</th>
                    <th className="text-right py-2 px-2">PNL</th>
                    <th className="text-right py-2 px-2">PNL %</th>
                  </tr>
                </thead>
                <tbody>
                  {investments.map((investment) => (
                    <tr
                      key={investment.id}
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleInvestmentClick(investment.id)}
                    >
                      <td className="py-3 px-2 font-medium">{investment.symbol}</td>
                      <td className="py-3 px-2">{investment.name}</td>
                      <td className="py-3 px-2">
                        {getInvestmentTypeLabel(investment.type)}
                      </td>
                      <td className="py-3 px-2 text-right">
                        {formatQuantity(investment.quantity, investment.type)}
                      </td>
                      <td className="py-3 px-2 text-right">
                        {formatCurrency(investment.averageCost || 0)}
                      </td>
                      <td className="py-3 px-2 text-right">
                        {formatCurrency(investment.currentPrice || 0)}
                      </td>
                      <td className="py-3 px-2 text-right font-medium">
                        {formatCurrency(investment.currentValue || 0)}
                      </td>
                      <td
                        className={`py-3 px-2 text-right font-medium ${
                          (investment.unrealizedPnl || 0) >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatCurrency(investment.unrealizedPnl || 0)}
                      </td>
                      <td
                        className={`py-3 px-2 text-right font-medium ${
                          (investment.unrealizedPnlPercent || 0) >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatPercent(investment.unrealizedPnlPercent || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </BaseCard>
      </div>
    </div>
  );
}
