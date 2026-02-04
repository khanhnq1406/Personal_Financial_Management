"use client";

import { useState, useCallback } from "react";
import {
  EVENT_BudgetGetBudgetItems,
  useQueryListBudgets,
} from "@/utils/generated/hooks";
import { BaseCard } from "@/components/BaseCard";
import { CardSkeleton } from "@/components/loading/Skeleton";
import { ButtonType, resources } from "@/app/constants";
import { Button } from "@/components/Button";
import Image from "next/image";
import { BudgetCard } from "@/app/dashboard/budget/BudgetCard";
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

type ModalState =
  | { type: "create-budget" }
  | { type: "edit-budget"; budget: Budget }
  | { type: "add-budget-item"; budgetId: number }
  | { type: "edit-budget-item"; budgetId: number; item: BudgetItem }
  | null;

export default function BudgetPage() {
  const queryClient = useQueryClient();
  const [modalState, setModalState] = useState<ModalState>(null);

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
    // Deletion is handled within BudgetCard component
    // Just refetch after deletion
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
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900">Budget</h1>
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

      {/* Budget Cards Grid */}
      {budgets.length === 0 ? (
        <BaseCard className="p-6 sm:p-8">
          <div className="flex flex-col items-center justify-center gap-4 py-8 sm:py-12">
            <div className="text-neutral-700 text-lg sm:text-xl font-semibold">No budgets yet</div>
            <div className="text-neutral-600 text-base text-center">
              Create your first budget to start tracking
            </div>
          </div>
        </BaseCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {budgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onRefresh={() => getListBudgets.refetch()}
              onEditBudget={handleEditBudget}
              onAddBudgetItem={handleAddBudgetItem}
              onEditBudgetItem={handleEditBudgetItem}
              onDeleteBudget={handleDeleteBudget}
            />
          ))}
        </div>
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
