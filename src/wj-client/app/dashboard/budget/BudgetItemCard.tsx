"use client";

import { BudgetItem } from "@/gen/protobuf/v1/budget";
import { currencyFormatter } from "@/utils/currency-formatter";
import Image from "next/image";
import { store } from "@/redux/store";
import { openModal } from "@/redux/actions";
import { ModalType, ButtonType, resources } from "@/app/constants";
import { Button } from "@/components/Button";

interface BudgetItemCardProps {
  item: BudgetItem;
  budgetId: number;
  onRefresh: () => void;
}

export function BudgetItemCard({
  item,
  budgetId,
  onRefresh,
}: BudgetItemCardProps) {
  const handleEditItem = () => {
    store.dispatch(
      openModal({
        isOpen: true,
        type: ModalType.EDIT_BUDGET_ITEM,
        onSuccess: () => {
          onRefresh();
        },
        data: { budgetId, item },
      }),
    );
  };

  const handleDeleteItem = () => {
    store.dispatch(
      openModal({
        isOpen: true,
        type: ModalType.CONFIRM,
        onSuccess: () => {
          onRefresh();
        },
        confirmConfig: {
          title: "Delete Budget Item",
          message: `Are you sure you want to delete "${item.name}"?`,
          confirmText: "Delete",
          cancelText: "Cancel",
          variant: "danger",
          action: {
            type: "deleteBudgetItem",
            payload: {
              budgetId,
              itemId: item.id,
            },
          },
        },
      }),
    );
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
      <div className="flex items-center gap-3 flex-1">
        <Image
          src={`${resources}/check.png`}
          alt="Check"
          width={20}
          height={20}
        />
        <div className="flex flex-col">
          <span className="font-semibold text-sm">{item.name}</span>
          <span className="text-xs text-gray-500">
            {currencyFormatter.format(item.total?.amount ?? 0)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type={ButtonType.IMG}
          src={`${resources}/editing.png`}
          onClick={handleEditItem}
        />
        <Button
          type={ButtonType.IMG}
          src={`${resources}/remove.png`}
          onClick={handleDeleteItem}
        />
      </div>
    </div>
  );
}
