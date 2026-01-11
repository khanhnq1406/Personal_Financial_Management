import { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  AddTransactionType,
  CreateWalletType,
  TransferMoneyType,
} from "./baseModal";
import {
  useQueryListWallets,
  useQueryListCategories,
  useMutationCreateCategory,
  EVENT_CategoryListCategories,
} from "@/utils/generated/hooks";
import { CategoryType } from "@/gen/protobuf/v1/transaction";
import { useQueryClient } from "@tanstack/react-query";
import { CreatableSelect } from "@/components/select/creatableSelect";
import { currencyFormatter } from "@/utils/currencyFormatter";

interface AddTransactionFormProps {
  setInput: Dispatch<
    SetStateAction<CreateWalletType | AddTransactionType | TransferMoneyType>
  >;
}

export const AddTransactionForm: React.FC<AddTransactionFormProps> = ({
  setInput,
}) => {
  const queryClient = useQueryClient();

  // Fetch wallets
  const { data: walletsData, isLoading: walletsLoading } = useQueryListWallets({
    pagination: { page: 1, pageSize: 100, orderBy: "id", order: "asc" },
  });

  // State for transaction type (income/expense)
  const [transactionType, setTransactionType] = useState<"income" | "expense">(
    "income"
  );

  // State for selected category ID and name
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>("");

  // Fetch categories filtered by type
  const { data: categoriesData, isLoading: categoriesLoading } =
    useQueryListCategories({
      pagination: { page: 1, pageSize: 100, orderBy: "id", order: "asc" },
      type:
        transactionType === "income"
          ? CategoryType.CATEGORY_TYPE_INCOME
          : CategoryType.CATEGORY_TYPE_EXPENSE,
    });

  // Mutation for creating new categories
  const createCategoryMutation = useMutationCreateCategory({
    onSuccess: (data) => {
      // Invalidate categories query to refetch with new category
      queryClient.invalidateQueries({
        queryKey: [EVENT_CategoryListCategories],
      });
      // Set the newly created category ID and name
      if (data.data?.id && data.data?.name) {
        const categoryId = String(data.data.id);
        setSelectedCategoryId(categoryId);
        setSelectedCategoryName(data.data.name);
        setInput((input) => ({
          ...input,
          categoryId: data.data?.id,
        }));
      }
    },
  });

  const wallets = walletsData?.wallets || [];
  const categories = categoriesData?.categories || [];

  const handleCreateCategory = async (categoryName: string) => {
    await createCategoryMutation.mutateAsync({
      name: categoryName,
      type:
        transactionType === "income"
          ? CategoryType.CATEGORY_TYPE_INCOME
          : CategoryType.CATEGORY_TYPE_EXPENSE,
    });
  };

  // Initialize with current date/time on mount
  useEffect(() => {
    const now = new Date();
    const timestamp = Math.floor(now.getTime() / 1000);
    setInput((input) => ({
      ...input,
      date: timestamp,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset category when transaction type changes
  useEffect(() => {
    setSelectedCategoryId("");
    setSelectedCategoryName("");
    setInput((input) => ({
      ...input,
      categoryId: undefined,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionType]);

  // Clear displayValue once the newly created category is in the options list
  useEffect(() => {
    if (selectedCategoryId && selectedCategoryName) {
      const categoryExists = categories.find(
        (c) => String(c.id) === selectedCategoryId
      );
      if (categoryExists) {
        setSelectedCategoryName(""); // Clear displayValue since the option is now in the list
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, selectedCategoryId, selectedCategoryName]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateStr = e.target.value;
    if (dateStr) {
      const date = new Date(dateStr);
      const timestamp = Math.floor(date.getTime() / 1000);
      setInput((input) => ({
        ...input,
        date: timestamp,
      }));
    }
  };

  return (
    <div>
      {/* Transaction Type Toggle */}
      <div className="mb-3">
        <div className="text-sm font-medium mb-1">Transaction Type</div>
        <div className="flex gap-2">
          <button
            type="button"
            className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
              transactionType === "income"
                ? "bg-green-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
            onClick={() => setTransactionType("income")}
          >
            Income
          </button>
          <button
            type="button"
            className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
              transactionType === "expense"
                ? "bg-red-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
            onClick={() => setTransactionType("expense")}
          >
            Expense
          </button>
        </div>
      </div>

      {/* Amount */}
      <div className="mb-2">
        <div>
          Amount<span className="required">*</span>
        </div>
        <input
          className="p-2 drop-shadow-round rounded-lg w-full mt-1"
          type="number"
          placeholder="0.00"
          min="0"
          step="0.01"
          onChange={(e) =>
            setInput((input) => ({
              ...input,
              amount: Number(e.target.value),
            }))
          }
        />
      </div>

      {/* Wallet */}
      <div className="mb-2">
        <div>
          Wallet<span className="required">*</span>
        </div>
        <select
          defaultValue={""}
          className="p-2 drop-shadow-round rounded-lg w-full mt-1"
          disabled={walletsLoading}
          onChange={(e) =>
            setInput((input) => ({
              ...input,
              walletId: e.target.value ? Number(e.target.value) : undefined,
            }))
          }
        >
          <option value={""} disabled>
            {walletsLoading ? "Loading wallets..." : "Select wallet"}
          </option>
          {wallets.map((wallet) => (
            <option key={wallet.id} value={wallet.id}>
              {wallet.walletName} (
              {currencyFormatter.format(wallet.balance?.amount || 0)})
            </option>
          ))}
        </select>
      </div>

      {/* Category */}
      <div className="mb-2">
        <div>
          Category<span className="required">*</span>
        </div>
        <CreatableSelect
          options={categories.map((category) => ({
            value: String(category.id),
            label: category.name,
          }))}
          value={selectedCategoryId}
          displayValue={selectedCategoryName}
          onChange={(value: string) => {
            setSelectedCategoryId(value);
            // Find and set the category name from the options
            const category = categories.find((c) => String(c.id) === value);
            setSelectedCategoryName(category?.name || "");
            setInput((input) => ({
              ...input,
              categoryId: value ? Number(value) : undefined,
            }));
          }}
          onCreate={handleCreateCategory}
          placeholder={
            categoriesLoading
              ? "Loading categories..."
              : "Select or create category..."
          }
          disabled={categoriesLoading}
          className="mt-1"
          isLoading={createCategoryMutation.isPending}
        />
      </div>

      {/* Date & Time */}
      <div className="mb-2">
        <div>
          Date & Time<span className="required">*</span>
        </div>
        <input
          type="datetime-local"
          className="p-2 drop-shadow-round rounded-lg w-full mt-1"
          onChange={handleDateChange}
        />
      </div>

      {/* Note */}
      <div className="mb-2">
        <div>Note</div>
        <input
          className="p-2 drop-shadow-round rounded-lg w-full mt-1"
          type="text"
          placeholder="Enter note (optional)"
          onChange={(e) =>
            setInput((input) => ({
              ...input,
              note: e.target.value,
            }))
          }
        />
      </div>
    </div>
  );
};
