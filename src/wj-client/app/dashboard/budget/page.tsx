"use client";

/**
 * Enhanced Budget Page with Data Visualization
 *
 * Phase 5 Refactoring: Mobile-optimized budget tracking with charts
 *
 * Features:
 * - Enhanced budget progress cards with circular progress
 * - Category breakdown with list and chart views
 * - Animated progress bars
 * - Over-budget warnings
 * - Days remaining indicators
 */

import { useState, useCallback, useMemo } from "react";
import {
  EVENT_BudgetGetBudgetItems,
  useQueryListBudgets,
} from "@/utils/generated/hooks";
import { BaseCard } from "@/components/BaseCard";
import { CardSkeleton } from "@/components/loading/Skeleton";
import { ButtonType, resources } from "@/app/constants";
import { Button } from "@/components/Button";
import Image from "next/image";
import { BudgetProgressCard } from "./BudgetProgressCard";
import { CategoryBreakdown } from "./CategoryBreakdown";
import { BaseModal } from "@/components/modals/BaseModal";
import {
  CreateBudgetForm,
  EditBudgetForm,
  CreateBudgetItemForm,
  EditBudgetItemForm,
} from "@/components/lazy/OptimizedComponents";
import { useQueryClient } from "@tanstack/react-query";
import { EVENT_BudgetListBudgets } from "@/utils/generated/hooks";
import { Budget, BudgetItem } from "@/gen/protobuf/v1/budget";
import { motion, AnimatePresence } from "framer-motion";
import { DonutChart, BarChart } from "@/components/charts";

type ModalState =
  | { type: "create-budget" }
  | { type: "edit-budget"; budget: Budget }
  | { type: "add-budget-item"; budgetId: number }
  | { type: "edit-budget-item"; budgetId: number; item: BudgetItem }
  | null;

export default function BudgetPageEnhanced() {
  const queryClient = useQueryClient();
  const [modalState, setModalState] = useState<ModalState>(null);
  const [selectedBudgetId, setSelectedBudgetId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"summary" | "breakdown">("summary");

  const getListBudgets = useQueryListBudgets(
    { pagination: { page: 1, pageSize: 10, orderBy: "", order: "" } },
    { refetchOnMount: "always" },
  );

  const handleCreateBudget = () => {
    setModalState({ type: "create-budget" });
  };

  const handleEditBudget = useCallback((budget: Budget) => {
    setModalState({ type: "edit-budget", budget });
  }, []);

  const handleAddBudgetItem = useCallback((budgetId: number) => {
    setModalState({ type: "add-budget-item", budgetId });
  }, []);

  const handleEditBudgetItem = useCallback(
    (budgetId: number, item: BudgetItem) => {
      setModalState({ type: "edit-budget-item", budgetId, item });
    },
    [],
  );

  const handleDeleteBudget = useCallback(() => {
    getListBudgets.refetch();
  }, [getListBudgets]);

  const handleModalClose = useCallback(() => {
    setModalState(null);
  }, []);

  const handleModalSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [EVENT_BudgetListBudgets] });
    queryClient.invalidateQueries({ queryKey: [EVENT_BudgetGetBudgetItems] });
    handleModalClose();
  }, [queryClient, handleModalClose]);

  const getModalTitle = useCallback(() => {
    switch (modalState?.type) {
      case "create-budget":
        return "Create Budget";
      case "edit-budget":
        return "Edit Budget";
      case "add-budget-item":
        return "Add Budget Item";
      case "edit-budget-item":
        return "Edit Budget Item";
      default:
        return "";
    }
  }, [modalState]);

  // Calculate overall budget summary
  const budgetSummary = useMemo(() => {
    const budgets = getListBudgets.data?.budgets ?? [];
    const totalBudget = budgets.reduce(
      (sum, b) => sum + (b.displayTotal?.amount ?? b.total?.amount ?? 0),
      0,
    );

    // We'd need to fetch all budget items to get total spent
    // For now, we'll show a placeholder structure
    return {
      totalBudget,
      budgetCount: budgets.length,
    };
  }, [getListBudgets.data]);

  // Prepare chart data
  const budgetChartData = useMemo(() => {
    const budgets = getListBudgets.data?.budgets ?? [];
    return budgets.map((b) => ({
      name: b.name,
      value: b.displayTotal?.amount ?? b.total?.amount ?? 0,
    }));
  }, [getListBudgets.data]);

  if (getListBudgets.isLoading) {
    return (
      <div className="flex flex-col gap-3 sm:gap-4 px-3 sm:px-4 md:px-6 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="h-8 w-32 bg-neutral-200 rounded animate-pulse" />
          <div className="h-10 w-40 bg-neutral-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CardSkeleton lines={5} showAction={true} />
          <CardSkeleton lines={5} showAction={true} />
        </div>
      </div>
    );
  }

  if (getListBudgets.error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="text-danger-600">Error loading budgets</div>
        <Button
          type={ButtonType.PRIMARY}
          onClick={() => getListBudgets.refetch()}
          className="w-fit px-5"
        >
          Retry
        </Button>
      </div>
    );
  }

  const budgets = getListBudgets.data?.budgets ?? [];

  return (
    <div className="flex flex-col gap-3 sm:gap-4 px-3 sm:px-4 md:px-6 py-3 sm:py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900">
          Budget
        </h1>
        <Button
          type={ButtonType.PRIMARY}
          onClick={handleCreateBudget}
          fullWidth={false}
          className="px-4 py-2 rounded-md drop-shadow-round"
        >
          <div className="flex items-center gap-2">
            <Image
              src={`${resources}/plus.png`}
              alt="Add"
              width={20}
              height={20}
            />
            <span className="hidden sm:inline">Create budget</span>
            <span className="sm:hidden">New budget</span>
          </div>
        </Button>
      </div>

      {/* View Mode Toggle */}
      {budgets.length > 0 && (
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("summary")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "summary"
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            Summary View
          </button>
          <button
            onClick={() => setViewMode("breakdown")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "breakdown"
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            Category Breakdown
          </button>
        </div>
      )}

      {/* Empty State */}
      {budgets.length === 0 ? (
        <BaseCard className="p-6 sm:p-8">
          <div className="flex flex-col items-center justify-center gap-4 py-8 sm:py-12">
            <div className="text-neutral-700 text-lg sm:text-xl font-semibold">
              No budgets yet
            </div>
            <div className="text-neutral-600 text-base text-center">
              Create your first budget to start tracking
            </div>
          </div>
        </BaseCard>
      ) : (
        <>
          {/* Summary View */}
          <AnimatePresence mode="wait">
            {viewMode === "summary" ? (
              <motion.div
                key="summary"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Overall Budget Summary */}
                <BaseCard className="p-4 sm:p-6">
                  <h2 className="text-lg font-bold text-neutral-900 mb-4">
                    Budget Overview
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Budget Allocation Chart */}
                    {budgetChartData.length > 0 && (
                      <div className="h-64">
                        <DonutChart
                          data={budgetChartData}
                          innerRadius="50%"
                          outerRadius="80%"
                          height={256}
                          centerLabel={`${budgets.length}`}
                          centerSubLabel="Active Budgets"
                          showLegend={true}
                          legendPosition="right"
                        />
                      </div>
                    )}

                    {/* Budget List */}
                    <div className="space-y-3">
                      {budgets.map((budget) => {
                        const budgetAmount = budget.displayTotal?.amount ?? budget.total?.amount ?? 0;
                        return (
                          <div
                            key={budget.id}
                            onClick={() => setSelectedBudgetId(budget.id)}
                            className="p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-neutral-900">
                                {budget.name}
                              </span>
                              <span className="text-sm text-neutral-600">
                                {budgetAmount.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </BaseCard>

                {/* Budget Progress Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {budgets.map((budget) => (
                    <BudgetProgressCard
                      key={budget.id}
                      data={{
                        totalBudget: budget.displayTotal?.amount ?? budget.total?.amount ?? 0,
                        totalSpent: 0, // Would need budget items to calculate
                        currency: budget.displayCurrency || budget.currency,
                        periodName: budget.name,
                        daysRemaining: undefined,
                        // itemCount: budget.itemCount, // itemCount doesn't exist on Budget type
                      }}
                      onAddExpense={() => handleAddBudgetItem(budget.id)}
                      onViewBreakdown={() => {
                        setSelectedBudgetId(budget.id);
                        setViewMode("breakdown");
                      }}
                      compact={true}
                    />
                  ))}
                </div>
              </motion.div>
            ) : (
              /* Breakdown View */
              <motion.div
                key="breakdown"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <CategoryBreakdown
                  categories={[]} // Would be populated with budget items
                  onAddExpense={handleAddBudgetItem}
                  onEditBudget={(categoryId) => {
                    // For now, this opens the edit budget modal
                    // In a full implementation, this would edit the budget item
                    if (selectedBudgetId) {
                      handleEditBudget({ id: selectedBudgetId } as any);
                    }
                  }}
                  viewMode="list"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Modals */}
      {modalState && (
        <BaseModal
          isOpen={modalState !== null}
          onClose={handleModalClose}
          title={getModalTitle()}
        >
          {modalState.type === "create-budget" && (
            <CreateBudgetForm onSuccess={handleModalSuccess} />
          )}
          {modalState.type === "edit-budget" && (
            <EditBudgetForm
              budget={modalState.budget}
              onSuccess={handleModalSuccess}
            />
          )}
          {modalState.type === "add-budget-item" && (
            <CreateBudgetItemForm
              budgetId={modalState.budgetId}
              onSuccess={handleModalSuccess}
            />
          )}
          {modalState.type === "edit-budget-item" && (
            <EditBudgetItemForm
              budgetId={modalState.budgetId}
              item={modalState.item}
              onSuccess={handleModalSuccess}
            />
          )}
        </BaseModal>
      )}
    </div>
  );
}
