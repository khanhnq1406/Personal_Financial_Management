"use client";

import { useQueryListBudgets } from "@/utils/generated/hooks";
import { BaseCard } from "@/components/BaseCard";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { store } from "@/redux/store";
import { openModal } from "@/redux/actions";
import { ModalType, ButtonType, resources } from "@/app/constants";
import { Button } from "@/components/Button";
import Image from "next/image";
import { BudgetCard } from "@/app/dashboard/budget/BudgetCard";

export default function BudgetPage() {
  const getListBudgets = useQueryListBudgets(
    { pagination: { page: 1, pageSize: 10, orderBy: "", order: "" } },
    { refetchOnMount: "always" },
  );

  const handleCreateBudget = () => {
    store.dispatch(
      openModal({
        isOpen: true,
        type: ModalType.ADD_BUDGET,
        onSuccess: () => {
          getListBudgets.refetch();
        },
      }),
    );
  };

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
    <div className="flex flex-col gap-4 px-3 py-4">
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
