"use client";

import { useState, useCallback } from "react";
import {
  EVENT_BudgetGetBudgetItems,
  useQueryListBudgets,
} from "@/utils/generated/hooks";
import { BaseCard } from "@/components/BaseCard";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { ButtonType, resources } from "@/app/constants";
import { Button } from "@/components/Button";
import Image from "next/image";
import { BudgetCard } from "@/app/dashboard/budget/BudgetCard";
import { BaseModal } from "@/components/modals/BaseModal";
import { CreateBudgetForm } from "@/components/modals/forms/CreateBudgetForm";
import { EditBudgetForm } from "@/components/modals/forms/EditBudgetForm";
import { CreateBudgetItemForm } from "@/components/modals/forms/CreateBudgetItemForm";
import { EditBudgetItemForm } from "@/components/modals/forms/EditBudgetItemForm";
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
      <div className="flex justify-center items-center h-full">
        <LoadingSpinner text="Loading budgets..." />
      </div>
    );
  }

  if (getListBudgets.error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="text-lred">Error loading budgets</div>
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
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Budget</h1>
        <Button
          type={ButtonType.PRIMARY}
          onClick={handleCreateBudget}
          className="px-4 py-2 rounded-md drop-shadow-round w-fit"
        >
          <div className="flex items-center gap-2">
            <Image
              src={`${resources}/plus.png`}
              alt="Add"
              width={20}
              height={20}
            />
            <span>Create budget</span>
          </div>
        </Button>
      </div>

      {/* Budget Cards Grid */}
      {budgets.length === 0 ? (
        <BaseCard className="p-8">
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <div className="text-gray-500 text-lg">No budgets yet</div>
            <div className="text-gray-400">
              Create your first budget to start tracking
            </div>
          </div>
        </BaseCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
