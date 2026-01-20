# Wallets Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a dedicated Wallets page at `/dashboard/wallets` that displays all user wallets with CRUD capabilities (create, edit, delete, transfer), following existing project patterns and styling conventions.

**Architecture:** Create a new Next.js page with reusable wallet card components, integrated with existing React Query hooks for wallet management. The page will follow the established patterns from Budget page and use existing modal system for wallet operations.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, React Query, Redux Toolkit, existing protobuf-generated API hooks

---

## Design Adaptation: Figma → Project Conventions

| Figma Design | Project Convention | Notes |
|-------------|-------------------|-------|
| Font: Plus Jakarta Sans | Existing global font | Uses project's default font |
| Primary green: #008148, #00a445 | `bg: #008148`, `hgreen: var(--btn-green)` | Use existing color variables |
| Card shadow: `0px 0px 10px rgba(0, 0, 0, 0.25)` | `drop-shadow-round: 0px 0px 3px rgb(0 0 0 / 0.4)` | Use existing Tailwind class |
| Card radius: 10px | `rounded-md` (from BaseCard) | Use BaseCard component |
| Text sizes: 17px, 18px, 24px | `text-base`, `text-lg`, `font-bold` | Use Tailwind text classes |
| Button custom styles | `Button` component with `ButtonType.PRIMARY` | Use existing Button component |
| Icons as images | `resources` CDN + `Image` component | Use existing pattern from home page |
| Custom grid spacing | `gap-4` Tailwind class | Use consistent gap spacing |

---

## Implementation Tasks

### Task 1: Create Wallets Page Structure

**Files:**
- Create: `src/wj-client/app/dashboard/wallets/page.tsx`
- Create: `src/wj-client/app/dashboard/wallets/WalletCard.tsx`
- Create: `src/wj-client/app/dashboard/wallets/WalletGrid.tsx`
- Modify: `src/wj-client/app/constants.tsx` (add ModalType.EDIT_WALLET)

**Step 1: Add EDIT_WALLET modal type to constants**

Open: `src/wj-client/app/constants.tsx`
Go to line 122 (ModalType enum)
Add after `CREATE_WALLET`:

```typescript
export const ModalType = {
  ADD_TRANSACTION: "Add Transaction",
  EDIT_TRANSACTION: "Edit Transaction",
  TRANSFER_MONEY: "Transfer Money",
  CREATE_WALLET: "Create New Wallet",
  EDIT_WALLET: "Edit Wallet",
  DELETE_WALLET: "Delete Wallet",
  SUCCESS: "Success",
  CONFIRM: "Confirm",
  ADD_BUDGET: "Add Budget",
  EDIT_BUDGET: "Edit Budget",
  ADD_BUDGET_ITEM: "Add Budget Item",
  EDIT_BUDGET_ITEM: "Edit Budget Item",
};
```

**Step 2: Create WalletCard component**

Create: `src/wj-client/app/dashboard/wallets/WalletCard.tsx`

```typescript
"use client";

import { memo } from "react";
import Image from "next/image";
import { Wallet } from "@/gen/protobuf/v1/wallet";
import { BaseCard } from "@/components/BaseCard";
import { resources, ButtonType } from "@/app/constants";
import { Button } from "@/components/Button";
import { currencyFormatter } from "@/utils/currency-formatter";

interface WalletCardProps {
  wallet: Wallet;
  onEdit: (wallet: Wallet) => void;
  onDelete: (wallet: Wallet) => void;
}

export const WalletCard = memo(function WalletCard({ wallet, onEdit, onDelete }: WalletCardProps) {
  return (
    <BaseCard>
      <div className="flex items-center justify-between gap-3 p-3">
        {/* Wallet Icon - matching home page pattern */}
        <Image
          src={`${resources}wallet.png`}
          alt="wallet-icon"
          width={25}
          height={25}
        />

        {/* Wallet Info - matching home page Wallets component */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{wallet.walletName}</div>
          <div className="font-semibold">
            {currencyFormatter.format(wallet.balance?.amount ?? 0)}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            type={ButtonType.IMG}
            src={`${resources}editing.png`}
            onClick={() => onEdit(wallet)}
            aria-label="Edit wallet"
          />
          <Button
            type={ButtonType.IMG}
            src={`${resources}remove.png`}
            onClick={() => onDelete(wallet)}
            aria-label="Delete wallet"
          />
        </div>
      </div>
    </BaseCard>
  );
});
```

**Step 3: Create WalletGrid component**

Create: `src/wj-client/app/dashboard/wallets/WalletGrid.tsx`

```typescript
"use client";

import { memo } from "react";
import { Wallet } from "@/gen/protobuf/v1/wallet";
import { WalletCard } from "./WalletCard";
import { BaseCard } from "@/components/BaseCard";
import Image from "next/image";
import { resources } from "@/app/constants";

interface WalletGridProps {
  wallets: Wallet[];
  isLoading?: boolean;
  onEditWallet: (wallet: Wallet) => void;
  onDeleteWallet: (wallet: Wallet) => void;
}

export const WalletGrid = memo(function WalletGrid({
  wallets,
  isLoading = false,
  onEditWallet,
  onDeleteWallet,
}: WalletGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <BaseCard key={i}>
            <div className="flex items-center gap-3 p-3">
              <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
              </div>
            </div>
          </BaseCard>
        ))}
      </div>
    );
  }

  if (wallets.length === 0) {
    return (
      <BaseCard>
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <Image
            src={`${resources}wallet.png`
            alt="No wallets"
            width={64}
            height={64}
            className="opacity-30"
          />
          <div className="text-gray-500 text-lg">No wallets yet</div>
          <div className="text-gray-400">
            Create your first wallet to start tracking
          </div>
        </div>
      </BaseCard>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {wallets.map((wallet) => (
        <WalletCard
          key={wallet.id}
          wallet={wallet}
          onEdit={onEditWallet}
          onDelete={onDeleteWallet}
        />
      ))}
    </div>
  );
});
```

**Step 4: Create main Wallets page**

Create: `src/wj-client/app/dashboard/wallets/page.tsx`

```typescript
"use client";

import { useQueryListWallets } from "@/utils/generated/hooks";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { store } from "@/redux/store";
import { openModal } from "@/redux/actions";
import { ModalType, ButtonType, resources } from "@/app/constants";
import { Button } from "@/components/Button";
import Image from "next/image";
import { WalletGrid } from "./WalletGrid";
import { Wallet } from "@/gen/protobuf/v1/wallet";

export default function WalletsPage() {
  const getListWallets = useQueryListWallets(
    { pagination: { page: 1, pageSize: 100, orderBy: "id", order: "asc" } },
    { refetchOnMount: "always" },
  );

  const handleCreateWallet = () => {
    store.dispatch(
      openModal({
        isOpen: true,
        type: ModalType.CREATE_WALLET,
        onSuccess: () => {
          getListWallets.refetch();
        },
      }),
    );
  };

  const handleEditWallet = (wallet: Wallet) => {
    store.dispatch(
      openModal({
        isOpen: true,
        type: ModalType.EDIT_WALLET,
        data: { wallet },
        onSuccess: () => {
          getListWallets.refetch();
        },
      }),
    );
  };

  const handleDeleteWallet = (wallet: Wallet) => {
    store.dispatch(
      openModal({
        isOpen: true,
        type: ModalType.CONFIRM,
        confirmConfig: {
          title: "Delete Wallet",
          message: `Are you sure you want to delete "${wallet.walletName}"? This action cannot be undone.`,
          confirmText: "Delete",
          cancelText: "Cancel",
          action: { type: "deleteWallet", payload: wallet.id },
          variant: "danger",
        },
      }),
    );
  };

  if (getListWallets.isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <LoadingSpinner text="Loading wallets..." />
      </div>
    );
  }

  if (getListWallets.error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="text-lred">Error loading wallets</div>
        <Button
          type={ButtonType.PRIMARY}
          onClick={() => getListWallets.refetch()}
          className="w-fit px-5"
        >
          Retry
        </Button>
      </div>
    );
  }

  const wallets = getListWallets.data?.wallets ?? [];

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header - matching Budget page pattern */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">My Wallets</h1>
        <Button
          type={ButtonType.PRIMARY}
          onClick={handleCreateWallet}
          className="px-4 py-2 rounded-md drop-shadow-round w-fit"
        >
          <div className="flex items-center gap-2">
            <Image
              src={`${resources}plus.png`}
              alt="Add"
              width={20}
              height={20}
            />
            <span>Create new wallet</span>
          </div>
        </Button>
      </div>

      {/* Wallet Cards Grid */}
      <WalletGrid
        wallets={wallets}
        onEditWallet={handleEditWallet}
        onDeleteWallet={handleDeleteWallet}
      />
    </div>
  );
}
```

**Step 5: Verify page renders**

Run: `cd src/wj-client && npm run dev`
Visit: `http://localhost:3000/dashboard/wallets`
Expected: Page with "My Wallets" header, "Create new wallet" button, empty state or wallet list

---

### Task 2: Create EditWalletForm Component

**Files:**
- Create: `src/wj-client/components/modals/forms/EditWalletForm.tsx`
- Modify: `src/wj-client/lib/validation/wallet.schema.ts` (add updateWalletSchema)

**Step 1: Add updateWalletSchema to validation file**

Open: `src/wj-client/lib/validation/wallet.schema.ts`

```typescript
import { z } from "zod";
import { WalletType } from "@/gen/protobuf/v1/wallet";

// Existing schemas
export const createWalletSchema = z.object({
  walletName: z.string().min(1, "Wallet name is required"),
  initialBalance: z.number().min(0, "Balance must be positive"),
  type: z.nativeEnum(WalletType),
});

export const createWalletSchemaWithExisting = (existingNames: string[]) => {
  return createWalletSchema.refine(
    (data) => !existingNames.includes(data.walletName),
    {
      path: ["walletName"],
      message: "A wallet with this name already exists",
    }
  );
};

// NEW: Update wallet schema
export const updateWalletSchema = (currentWalletName: string, otherWalletNames: string[]) => {
  return z.object({
    walletName: z.string().min(1, "Wallet name is required")
      .refine((name) => {
        return name === currentWalletName || !otherWalletNames.includes(name);
      }, {
        message: "A wallet with this name already exists",
      }),
    balance: z.number().min(0, "Balance must be positive"),
  });
};

export type CreateWalletFormOutput = z.infer<typeof createWalletSchema>;
export type UpdateWalletFormOutput = z.infer<ReturnType<typeof updateWalletSchema>>;
```

**Step 2: Create EditWalletForm component**

Create: `src/wj-client/components/modals/forms/EditWalletForm.tsx`

```typescript
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryListWallets } from "@/utils/generated/hooks";
import { FormInput } from "@/components/forms/FormInput";
import { FormNumberInput } from "@/components/forms/FormNumberInput";
import { Wallet } from "@/gen/protobuf/v1/wallet";
import {
  updateWalletSchema,
  UpdateWalletFormOutput,
} from "@/lib/validation/wallet.schema";

interface EditWalletFormProps {
  wallet: Wallet;
  onSubmit: (data: UpdateWalletFormOutput) => void;
  isPending?: boolean;
}

export const EditWalletForm = ({ wallet, onSubmit, isPending }: EditWalletFormProps) => {
  const { data: walletsData } = useQueryListWallets({
    pagination: { page: 1, pageSize: 100, orderBy: "id", order: "asc" },
  });

  const otherWalletNames =
    walletsData?.wallets
      ?.filter((w) => w.id !== wallet.id)
      .map((w) => w.walletName) || [];

  const { control, handleSubmit } = useForm<UpdateWalletFormOutput>({
    resolver: zodResolver(updateWalletSchema(wallet.walletName, otherWalletNames)),
    defaultValues: {
      walletName: wallet.walletName,
      balance: wallet.balance?.amount ?? 0,
    },
    mode: "onSubmit",
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} id="edit-wallet-form">
      <FormInput
        name="walletName"
        control={control}
        label="Name"
        placeholder="Enter wallet's name"
        required
        disabled={isPending}
      />

      <FormNumberInput
        name="balance"
        control={control}
        label="Adjust Balance"
        suffix="VND"
        disabled={isPending}
      />
    </form>
  );
};
```

---

### Task 3: Integrate Edit/Delete Wallet into BaseModal

**Files:**
- Modify: `src/wj-client/components/modals/BaseModal.tsx`

**Step 1: Verify wallet mutation hooks exist**

Run: `grep -n "useMutationUpdateWallet\|useMutationDeleteWallet" src/wj-client/utils/generated/hooks.ts`

If not found, run: `task proto:api`

**Step 2: Add imports and mutations to BaseModal**

Open: `src/wj-client/components/modals/BaseModal.tsx`

Add to imports (around line 12-29):

```typescript
import {
  useMutationCreateWallet,
  useMutationTransferFunds,
  useMutationCreateTransaction,
  useMutationUpdateTransaction,
  useMutationDeleteTransaction,
  useMutationUpdateWallet,
  useMutationDeleteWallet,
  useMutationCreateBudget,
  useMutationUpdateBudget,
  useMutationDeleteBudget,
  useMutationCreateBudgetItem,
  useMutationUpdateBudgetItem,
  useMutationDeleteBudgetItem,
  // ... rest
} from "@/utils/generated/hooks";
import { EditWalletForm } from "./forms/EditWalletForm";
import { UpdateWalletFormOutput } from "@/lib/validation/wallet.schema";
```

Add mutations after line 213:

```typescript
  const updateWalletItemMutation = useMutationUpdateBudgetItem();

  // Wallet mutations
  const updateWalletMutation = useMutationUpdateWallet();
  const deleteWalletMutation = useMutationDeleteWallet();
```

Add deleteWallet case in handleConfirmAction (after deleteBudget case, around line 163):

```typescript
        case "deleteBudget":
          await deleteBudgetMutation.mutateAsync(action.payload);
          break;
        case "deleteWallet":
          await deleteWalletMutation.mutateAsync(action.payload);
          break;
```

Add handleEditWallet after handleTransferFunds (around line 316):

```typescript
  const handleEditWallet = useCallback(
    (data: UpdateWalletFormOutput) => {
      setError("");
      if (!("data" in modal) || !modal.data?.wallet) {
        setError("Wallet data not found");
        return;
      }
      const wallet = modal.data.wallet;
      updateWalletMutation.mutate(
        {
          walletId: wallet.id,
          walletName: data.walletName,
          balance: {
            amount: data.balance,
            currency: "VND",
          },
        },
        {
          onSuccess: () => handleSuccess("Wallet has been updated successfully"),
          onError: (err: any) =>
            setError(err.message || "Failed to update wallet. Please try again"),
        },
      );
    },
    [updateWalletMutation, handleSuccess, modal],
  );
```

Update isLoading memo (add wallet mutations, around line 467):

```typescript
  const isLoading = useMemo(
    () =>
      createWalletMutation.isPending ||
      createTransactionMutation.isPending ||
      updateTransactionMutation.isPending ||
      transferFundsMutation.isPending ||
      updateWalletMutation.isPending ||
      deleteWalletMutation.isPending ||
      createBudgetMutation.isPending ||
      updateBudgetMutation.isPending ||
      createBudgetItemMutation.isPending ||
      updateBudgetItemMutation.isPending,
    [
      createWalletMutation.isPending,
      createTransactionMutation.isPending,
      updateTransactionMutation.isPending,
      transferFundsMutation.isPending,
      updateWalletMutation.isPending,
      deleteWalletMutation.isPending,
      createBudgetMutation.isPending,
      updateBudgetMutation.isPending,
      createBudgetItemMutation.isPending,
      updateBudgetItemMutation.isPending,
    ],
  );
```

Update handleButtonClick formId logic (around line 504):

```typescript
                : modal.type === ModalType.EDIT_WALLET
                    ? "edit-wallet-form"
                  : modal.type === ModalType.ADD_BUDGET
```

Add EditWalletForm rendering after CreateWalletForm (around line 571):

```typescript
        {modal.type === ModalType.EDIT_WALLET &&
          "data" in modal &&
          modal.data?.wallet && (
          <EditWalletForm
            wallet={modal.data.wallet}
            onSubmit={handleEditWallet}
            isPending={isLoading}
          />
        )}
```

**Step 3: Test edit and delete flow**

Run: `cd src/wj-client && npm run dev`
1. Visit `/dashboard/wallets`
2. Click edit button → verify modal opens with wallet data
3. Edit name/balance → save → verify update
4. Click delete button → verify confirmation
5. Confirm deletion → verify wallet removed

---

### Task 4: Update Navigation to Include Wallets Link

**Files:**
- Find navigation component and add Wallets link

**Step 1: Find navigation component**

Run: `find src/wj-client -name "*.tsx" -type f | xargs grep -l "routes\\.wallets\|Home.*Transactions.*Report" | head -5`

**Step 2: Add Wallets to navigation**

Pattern to follow (based on Budget page):

```typescript
// Import routes
import { routes } from "@/app/constants";

// In navigation component, add:
<ActiveLink href={routes.wallets}>Wallets</ActiveLink>
```

**Step 3: Test navigation**

Run: `cd src/wj-client && npm run dev`
1. Click Wallets link
2. Verify page loads
3. Verify active state styling

---

### Task 5: Final Testing and Polish

**Files:**
- All modified files

**Step 1: Complete CRUD flow test**

1. **Create:**
   - Click "Create new wallet"
   - Enter name "Test Wallet", balance 100000
   - Submit
   - Verify: Success modal, wallet appears

2. **Edit:**
   - Click edit on "Test Wallet"
   - Change to "Test Wallet v2", balance 250000
   - Submit
   - Verify: Wallet updated

3. **Delete:**
   - Click delete on "Test Wallet v2"
   - Confirm deletion
   - Verify: Wallet removed

**Step 2: Test responsive design**

1. Desktop (>800px): 3 column grid
2. Tablet (500-800px): 2 column grid
3. Mobile (<500px): 1 column grid

**Step 3: Verify accessibility**

- Alt text on images
- Aria labels on buttons
- Keyboard navigation
- Focus states visible

**Step 4: Check for errors**

```bash
cd src/wj-client
npm run lint
npm run build
```

---

## Testing Checklist

- [ ] Page loads at `/dashboard/wallets`
- [ ] "Create new wallet" button works
- [ ] Wallet creation with validation works
- [ ] Wallet displays in grid
- [ ] Edit button opens modal with data
- [ ] Can update wallet name and balance
- [ ] Delete shows confirmation
- [ ] Delete removes wallet
- [ ] Responsive grid works (1/2/3 columns)
- [ ] Loading state shows
- [ ] Empty state shows
- [ ] Navigation includes Wallets link
- [ ] No console errors
- [ ] Lint passes
- [ ] Build succeeds

---

## Key Design Decisions

1. **Used existing BaseCard component** instead of custom card styling
2. **Followed Budget page pattern** for page structure and header
3. **Reused home page Wallets component patterns** for wallet display
4. **Used existing Button component** with ButtonType enum
5. **Used existing colors from tailwind.config.ts** instead of Figma hex values
6. **Matched existing font sizes** using Tailwind classes
7. **Used existing icon resources** from CDN
8. **Followed existing modal patterns** for edit/delete operations

---

## References

- Similar Page: `src/wj-client/app/dashboard/budget/page.tsx`
- Existing Wallets: `src/wj-client/app/dashboard/home/Walllets.tsx`
- Modal System: `src/wj-client/components/modals/BaseModal.tsx`
- CreateWalletForm: `src/wj-client/components/modals/forms/CreateWalletForm.tsx`
- Validation: `src/wj-client/lib/validation/wallet.schema.ts`
- Constants: `src/wj-client/app/constants.tsx`
- Tailwind Config: `src/wj-client/tailwind.config.ts`
