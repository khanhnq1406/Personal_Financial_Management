"use client";

import React, { useState, useMemo } from "react";
import { BaseCard } from "@/components/BaseCard";
import { Button } from "@/components/Button";
import { ButtonType } from "@/app/constants";
import { BaseModal } from "@/components/modals/BaseModal";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { AddInvestmentForm } from "@/components/modals/forms/AddInvestmentForm";
import { CreateWalletForm } from "@/components/modals/forms/CreateWalletForm";
import { InvestmentDetailModal } from "@/components/modals/InvestmentDetailModal";
import {
  useQueryListWallets,
  useQueryGetPortfolioSummary,
  useQueryListInvestments,
} from "@/utils/generated/hooks";
import { WalletType } from "@/gen/protobuf/v1/wallet";
import {
  formatCurrency,
  formatPercent,
  formatQuantity,
  getInvestmentTypeLabel,
} from "./helpers";

const ModalType = {
  CREATE_WALLET: "CREATE_WALLET",
  ADD_INVESTMENT: "ADD_INVESTMENT",
  INVESTMENT_DETAIL: "INVESTMENT_DETAIL",
} as const;

export default function PortfolioPage() {
  const [selectedWalletId, setSelectedWalletId] = useState<number | null>(null);
  const [modalType, setModalType] = useState<keyof typeof ModalType | null>(
    null,
  );
  const [selectedInvestmentId, setSelectedInvestmentId] = useState<
    number | null
  >(null);

  // Fetch user's wallets
  const getListWallets = useQueryListWallets(
    {
      pagination: {
        page: 1,
        pageSize: 100,
        orderBy: "created_at",
        order: "desc",
      },
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
      typeFilter: 0,
    },
    {
      enabled: !!selectedWalletId,
      refetchOnMount: "always",
    },
  );

  const handleOpenModal = (
    type: keyof typeof ModalType,
    investmentId?: number,
  ) => {
    if (investmentId) {
      setSelectedInvestmentId(investmentId);
    }
    setModalType(type);
  };

  const handleCloseModal = () => {
    setModalType(null);
    setSelectedInvestmentId(null);
  };

  const handleModalSuccess = () => {
    // Refetch all data
    getListWallets.refetch();
    getPortfolioSummary.refetch();
    getListInvestments.refetch();
    handleCloseModal();
  };

  const getModalTitle = () => {
    switch (modalType) {
      case ModalType.CREATE_WALLET:
        return "Create Investment Wallet";
      case ModalType.ADD_INVESTMENT:
        return "Add Investment";
      case ModalType.INVESTMENT_DETAIL:
        return "Investment Details";
      default:
        return "";
    }
  };

  // Loading state
  if (getListWallets.isLoading || getListWallets.isPending) {
    return (
      <div className="flex items-center justify-center h-full">
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

  const portfolioSummary = getPortfolioSummary.data;
  const investments = getListInvestments.data?.data || [];

  // No investment wallets - render empty state with modal
  if (investmentWallets.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-700">
              No Investment Wallets
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Create an investment wallet to start tracking your portfolio
            </p>
          </div>
          <Button
            type={ButtonType.PRIMARY}
            onClick={() => handleOpenModal(ModalType.CREATE_WALLET)}
            className="w-fit px-4"
          >
            Create Investment Wallet
          </Button>
        </div>

        {/* Modal */}
        <BaseModal
          isOpen={modalType !== null}
          onClose={handleCloseModal}
          title={getModalTitle()}
        >
          {modalType === ModalType.CREATE_WALLET && (
            <CreateWalletForm
              onSuccess={handleModalSuccess}
              defaultType={WalletType.INVESTMENT}
            />
          )}
        </BaseModal>
      </>
    );
  }

  return (
    <>
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
          ) : portfolioSummary?.data ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <BaseCard className="p-4">
                <div className="text-sm text-gray-600">Total Value</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(portfolioSummary.data.totalValue || 0)}
                </div>
              </BaseCard>

              <BaseCard className="p-4">
                <div className="text-sm text-gray-600">Total Cost</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(portfolioSummary.data.totalCost || 0)}
                </div>
              </BaseCard>

              <BaseCard className="p-4">
                <div className="text-sm text-gray-600">Total PNL</div>
                <div
                  className={`text-2xl font-bold mt-1 ${
                    (portfolioSummary.data.totalPnl || 0) >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {formatCurrency(portfolioSummary.data.totalPnl || 0)}
                </div>
              </BaseCard>

              <BaseCard className="p-4">
                <div className="text-sm text-gray-600">Holdings</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {portfolioSummary.data.totalInvestments || 0}
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
                onClick={() => handleOpenModal(ModalType.ADD_INVESTMENT)}
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
                <p>
                  No investments yet. Add your first investment to get started.
                </p>
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
                        onClick={() =>
                          handleOpenModal(
                            ModalType.INVESTMENT_DETAIL,
                            investment.id,
                          )
                        }
                      >
                        <td className="py-3 px-2 font-medium">
                          {investment.symbol}
                        </td>
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

      {/* Modal */}
      <BaseModal
        isOpen={modalType !== null}
        onClose={handleCloseModal}
        title={getModalTitle()}
      >
        {modalType === ModalType.CREATE_WALLET && (
          <CreateWalletForm
            onSuccess={handleModalSuccess}
            defaultType={WalletType.INVESTMENT}
          />
        )}
        {modalType === ModalType.ADD_INVESTMENT && selectedWalletId && (
          <AddInvestmentForm
            walletId={selectedWalletId}
            onSuccess={handleModalSuccess}
          />
        )}
        {modalType === ModalType.INVESTMENT_DETAIL && selectedInvestmentId && (
          <InvestmentDetailModal
            isOpen={modalType === ModalType.INVESTMENT_DETAIL}
            onClose={handleCloseModal}
            investmentId={selectedInvestmentId}
            onSuccess={handleModalSuccess}
          />
        )}
      </BaseModal>
    </>
  );
}
