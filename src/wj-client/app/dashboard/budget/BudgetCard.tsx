"use client";

import { useState } from "react";
import { BaseCard } from "@/components/BaseCard";
import { Budget, BudgetItem } from "@/gen/protobuf/v1/budget";
import { formatCurrency } from "@/utils/currency-formatter";
import { useCurrency } from "@/contexts/CurrencyContext";
import { CircularProgress } from "./CircularProgress";
import { useQueryGetBudgetItems } from "@/utils/generated/hooks";
import { BudgetItemCard } from "./BudgetItemCard";
import { ButtonType, resources } from "@/app/constants";
import { Button } from "@/components/Button";
import { useMutationDeleteBudget } from "@/utils/generated/hooks";
import { ConfirmationDialog } from "@/components/modals/ConfirmationDialog";

interface BudgetCardProps {
  budget: Budget;
  onRefresh: () => void;
  onEditBudget: (budget: Budget) => void;
  onAddBudgetItem: (budgetId: number) => void;
  onEditBudgetItem: (budgetId: number, item: BudgetItem) => void;
  onDeleteBudget: (budgetId: number) => void;
}

export function BudgetCard({
  budget,
  onRefresh,
  onEditBudget,
  onAddBudgetItem,
  onEditBudgetItem,
}: BudgetCardProps) {
  const { currency } = useCurrency();
  const getBudgetItems = useQueryGetBudgetItems(
    { budgetId: budget.id },
    { enabled: !!budget.id },
  );

  const deleteBudgetMutation = useMutationDeleteBudget({
    onSuccess: () => {
      onRefresh();
    },
  });

  const budgetItems = getBudgetItems.data?.items ?? [];

  // Calculate total budget and spent amounts using display values
  const totalBudget = budget.displayTotal?.amount ?? budget.total?.amount ?? 0;
  const totalSpent = budgetItems.reduce(
    (sum, item) => sum + (item.displayTotal?.amount ?? item.total?.amount ?? 0),
    0,
  );
  const remaining = totalBudget - totalSpent;
  const percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteBudget = () => {
    setShowDeleteDialog(true);
  };

  const confirmDeleteBudget = () => {
    deleteBudgetMutation.mutate({ budgetId: budget.id });
    setShowDeleteDialog(false);
  };

  const cancelDeleteBudget = () => {
    setShowDeleteDialog(false);
  };

  return (
    <>
      <BaseCard className="p-4 flex flex-col gap-4">
        {/* Header with Edit and Delete buttons */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold">{budget.name}</h3>
          <div className="flex gap-2">
            <Button
              type={ButtonType.IMG}
              src={`${resources}/editing.png`}
              onClick={() => onEditBudget(budget)}
            />
            <Button
              type={ButtonType.IMG}
              src={`${resources}/remove.png`}
              onClick={handleDeleteBudget}
              disabled={deleteBudgetMutation.isPending}
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
          <div className="text-xl font-bold text-primary-600">
            {formatCurrency(totalBudget, currency)}
          </div>
          <div className="text-sm text-gray-500">Amount you can spend</div>
          <div className="text-xl font-bold text-gray-900">
            {formatCurrency(remaining, currency)}
          </div>
        </div>

        {/* Budget Items List */}
        <div className="border-t pt-3">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-semibold text-gray-700">
              Budget Items
            </h4>
            <Button
              type={ButtonType.IMG}
              src={`${resources}/plus.png`}
              onClick={() => onAddBudgetItem(budget.id)}
            />
          </div>

          {getBudgetItems.isLoading ? (
            <div className="text-center py-4 text-gray-500">
              Loading items...
            </div>
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
                  onEditItem={onEditBudgetItem}
                />
              ))}
            </div>
          )}
        </div>
      </BaseCard>

      {showDeleteDialog && (
        <ConfirmationDialog
          title="Delete Budget"
          message={
            <div className="flex flex-col gap-1">
              <div>{`Are you sure you want to delete "${budget.name}"?`}</div>
              <div>This action cannot be undone.</div>
            </div>
          }
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={confirmDeleteBudget}
          onCancel={cancelDeleteBudget}
          isLoading={deleteBudgetMutation.isPending}
          variant="danger"
        />
      )}
    </>
  );
}
