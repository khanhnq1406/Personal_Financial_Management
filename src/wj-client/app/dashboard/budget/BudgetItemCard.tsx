"use client";

import { useState } from "react";
import { BudgetItem } from "@/gen/protobuf/v1/budget";
import { formatCurrency } from "@/utils/currency-formatter";
import { useCurrency } from "@/contexts/CurrencyContext";
import { ButtonType, resources } from "@/app/constants";
import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
import {
  useMutationUpdateBudgetItem,
  useMutationDeleteBudgetItem,
} from "@/utils/generated/hooks";
import { EVENT_BudgetUpdateBudgetItem } from "@/utils/generated/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { ConfirmationDialog } from "@/components/modals/ConfirmationDialog";

interface BudgetItemCardProps {
  item: BudgetItem;
  budgetId: number;
  onRefresh: () => void;
  onEditItem: (budgetId: number, item: BudgetItem) => void;
}

export function BudgetItemCard({
  item,
  budgetId,
  onRefresh,
  onEditItem,
}: BudgetItemCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { currency } = useCurrency();
  const queryClient = useQueryClient();

  const updateBudgetItemMutation = useMutationUpdateBudgetItem({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [EVENT_BudgetUpdateBudgetItem],
      });
      onRefresh();
    },
  });

  const deleteBudgetItemMutation = useMutationDeleteBudgetItem({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [EVENT_BudgetUpdateBudgetItem],
      });
      onRefresh();
    },
  });

  const handleDeleteItem = () => {
    setShowDeleteDialog(true);
  };

  const confirmDeleteItem = () => {
    deleteBudgetItemMutation.mutate({
      budgetId,
      itemId: item.id,
    });
    setShowDeleteDialog(false);
  };

  const cancelDeleteItem = () => {
    setShowDeleteDialog(false);
  };

  const handleCheckedChange = (checked: boolean) => {
    updateBudgetItemMutation.mutate({
      budgetId,
      itemId: item.id,
      name: item.name,
      total: item.total,
      checked: checked,
    });
  };

  const isPending =
    updateBudgetItemMutation.isPending || deleteBudgetItemMutation.isPending;

  return (
    <>
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
        <div className="flex items-center gap-3 flex-1">
          <Checkbox
            checked={item.checked ?? false}
            onChange={handleCheckedChange}
            disabled={isPending}
          />
          <div className="flex flex-col">
            <span
              className={`font-semibold text-sm ${item.checked ? "line-through text-gray-400" : ""}`}
            >
              {item.name}
            </span>
            <span className="text-xs text-gray-500">
              {formatCurrency(item.displayTotal?.amount ?? item.total?.amount ?? 0, currency)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type={ButtonType.IMG}
            src={`${resources}/editing.svg`}
            onClick={() => onEditItem(budgetId, item)}
            disabled={isPending}
          />
          <Button
            type={ButtonType.IMG}
            src={`${resources}/remove.svg`}
            onClick={handleDeleteItem}
            disabled={isPending}
          />
        </div>
      </div>

      {showDeleteDialog && (
        <ConfirmationDialog
          title="Delete Budget Item"
          message={`Are you sure you want to delete "${item.name}"?`}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={confirmDeleteItem}
          onCancel={cancelDeleteItem}
          isLoading={deleteBudgetItemMutation.isPending}
          variant="danger"
        />
      )}
    </>
  );
}
