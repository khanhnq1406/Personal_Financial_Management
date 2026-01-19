"use client";

import { BaseCard } from "@/components/BaseCard";
import { Budget } from "@/gen/protobuf/v1/budget";
import { currencyFormatter } from "@/utils/currency-formatter";
import { CircularProgress } from "./CircularProgress";
import { useQueryGetBudgetItems } from "@/utils/generated/hooks";
import { BudgetItemCard } from "./BudgetItemCard";
import { store } from "@/redux/store";
import { openModal } from "@/redux/actions";
import { ModalType, ButtonType, resources } from "@/app/constants";
import { Button } from "@/components/Button";

interface BudgetCardProps {
  budget: Budget;
  onRefresh: () => void;
}

export function BudgetCard({ budget, onRefresh }: BudgetCardProps) {
  const getBudgetItems = useQueryGetBudgetItems(
    { budgetId: budget.id },
    { enabled: !!budget.id },
  );

  const budgetItems = getBudgetItems.data?.items ?? [];

  // Calculate total budget and spent amounts
  const totalBudget = budget.total?.amount ?? 0;
  const totalSpent = budgetItems.reduce(
    (sum, item) => sum + (item.total?.amount ?? 0),
    0,
  );
  const remaining = totalBudget - totalSpent;
  const percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const handleEditBudget = () => {
    store.dispatch(
      openModal({
        isOpen: true,
        type: ModalType.EDIT_BUDGET,
        onSuccess: () => {
          onRefresh();
        },
        data: { budget },
      }),
    );
  };

  const handleAddBudgetItem = () => {
    store.dispatch(
      openModal({
        isOpen: true,
        type: ModalType.ADD_BUDGET_ITEM,
        onSuccess: () => {
          getBudgetItems.refetch();
          onRefresh();
        },
        data: { budgetId: budget.id },
      }),
    );
  };

  const handleDeleteBudget = () => {
    store.dispatch(
      openModal({
        isOpen: true,
        type: ModalType.CONFIRM,
        confirmConfig: {
          title: "Delete Budget",
          message: `Are you sure you want to delete "${budget.name}"? This action cannot be undone.`,
          confirmText: "Delete",
          cancelText: "Cancel",
          action: {
            type: "deleteBudget",
            payload: { budgetId: budget.id },
          },
          variant: "danger",
        },
        onSuccess: () => {
          onRefresh();
        },
      }),
    );
  };

  return (
    <BaseCard className="p-4 flex flex-col gap-4">
      {/* Header with Edit and Delete buttons */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold">{budget.name}</h3>
        <div className="flex gap-2">
          <Button
            type={ButtonType.IMG}
            src={`${resources}/editing.png`}
            onClick={handleEditBudget}
          />
          <Button
            type={ButtonType.IMG}
            src={`${resources}/remove.png`}
            onClick={handleDeleteBudget}
          />
        </div>
      </div>

      {/* Circular Progress Indicator */}
      <div className="flex justify-center py-2">
        <CircularProgress percentage={percentage} size={180} />
      </div>

      {/* Budget Summary */}
      <div className="text-center space-y-1">
        <div className="text-sm text-gray-500">Total Budget</div>
        <div className="text-xl font-bold text-bg">
          {currencyFormatter.format(totalBudget)}
        </div>
        <div className="text-sm text-gray-500">Amount you can spend</div>
        <div className="text-xl font-bold text-gray-900">
          {currencyFormatter.format(remaining)}
        </div>
      </div>

      {/* Budget Items List */}
      <div className="border-t pt-3">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-sm font-semibold text-gray-700">Budget Items</h4>
          <Button
            type={ButtonType.IMG}
            src={`${resources}/plus.png`}
            onClick={handleAddBudgetItem}
          />
        </div>

        {getBudgetItems.isLoading ? (
          <div className="text-center py-4 text-gray-500">Loading items...</div>
        ) : budgetItems.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-sm">
            No budget items
          </div>
        ) : (
          <div className="space-y-2">
            {budgetItems.map((item) => (
              <BudgetItemCard
                key={item.id}
                item={item}
                budgetId={budget.id}
                onRefresh={() => {
                  getBudgetItems.refetch();
                  onRefresh();
                }}
              />
            ))}
          </div>
        )}
      </div>
    </BaseCard>
  );
}
