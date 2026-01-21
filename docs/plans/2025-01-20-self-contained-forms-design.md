# Self-Contained Form Components Design

**Date:** 2025-01-20
**Status:** Design Approved

## Problem Statement

The current architecture centralizes all mutation logic in `BaseModal.tsx` (765 lines), creating:
- Monolithic component that's hard to maintain
- Tight coupling between forms and BaseModal
- Limited reusability - forms can't be used outside modals
- Difficult to test mutations independently

## Proposed Solution

Move mutation logic **into each form component**, making forms self-contained "smart" components. `BaseModal` becomes a simple wrapper (~50 lines) that only provides modal behavior.

## Architecture Overview

### Current Flow
```
Page → Redux → BaseModal (all mutations) → Form Component (dumb)
```

### New Flow
```
Page (local state) → BaseModal (wrapper) → Form Component (self-contained)
```

## Component Structure

### 1. BaseModal (Simple Wrapper)

```typescript
// components/modals/baseModal.tsx
"use client";

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function BaseModal({ isOpen, onClose, title, children }: BaseModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
```

### 2. Form Component (Self-Contained)

```typescript
// components/modals/forms/CreateWalletForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { useMutationCreateWallet } from "@/utils/generated/hooks";
import { useState } from "react";

interface CreateWalletFormProps {
  onSuccess?: () => void;
}

export function CreateWalletForm({ onSuccess }: CreateWalletFormProps) {
  const createWallet = useMutationCreateWallet();
  const { control, handleSubmit, setError } = useForm({
    // ... form config
  });
  const [errorMessage, setErrorMessage] = useState<string>();

  const onSubmit = (data) => {
    createWallet.mutate(data, {
      onSuccess: () => {
        onSuccess?.();
      },
      onError: (error) => {
        setErrorMessage(error.message || "Failed to create wallet");
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {errorMessage && (
        <div className="bg-red-50 text-red-600 p-3 rounded">
          {errorMessage}
        </div>
      )}
      {/* Form fields */}
      <Button type="submit" loading={createWallet.isPending}>Create</Button>
    </form>
  );
}
```

### 3. Page Usage (Local State)

```typescript
// app/dashboard/home/page.tsx
"use client";

import { useState } from "react";
import { BaseModal } from "@/components/modals/baseModal";
import { CreateWalletForm } from "@/components/modals/forms/CreateWalletForm";
import { useQueryClient } from "@tanstack/react-query";

export default function HomePage() {
  const queryClient = useQueryClient();
  const [isCreateWalletOpen, setIsCreateWalletOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsCreateWalletOpen(true)}>Create Wallet</button>

      <BaseModal
        isOpen={isCreateWalletOpen}
        onClose={() => setIsCreateWalletOpen(false)}
        title="Create Wallet"
      >
        <CreateWalletForm
          onSuccess={() => {
            setIsCreateWalletOpen(false);
            queryClient.invalidateQueries({ queryKey: ["ListWallets"] });
          }}
        />
      </BaseModal>
    </>
  );
}
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ Page Component (owns modal state)                              │
│  - const [isOpen, setIsOpen] = useState(false)                 │
│  - Renders: <BaseModal><CreateWalletForm onSuccess={...} /></> │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ BaseModal (dumb wrapper)                                       │
│  - Receives: isOpen, onClose, title, children                  │
│  - Renders: Modal backdrop + container + children              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ CreateWalletForm (self-contained)                              │
│  - Owns: form state, mutation, error handling                  │
│  - On submit: calls mutate() → API → onSuccess callback        │
│  - On success: calls onSuccess() (caller handles refetch)      │
│  - On error: displays error in form                            │
└─────────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. Mutation Location
**Decision:** Each form component owns its mutation
**Rationale:** Forms become self-contained, reusable, easier to test

### 2. Error Handling
**Decision:** Each form handles its own errors
**Rationale:** Consistent error UI per form, forms display errors inline

Two types of errors:
- **Field-level:** Validation from react-hook-form/zod
- **Form-level:** API errors from mutation

### 3. Success Flow
**Decision:** Callback pattern - forms accept `onSuccess` callback
**Rationale:** Maximum flexibility for callers, they decide what to do (refetch, close modal, show message)

### 4. Cache Invalidation
**Decision:** Page component handles refetch via `onSuccess` callback
**Rationale:** More control than form invalidating queries, enables different behaviors per usage

### 5. State Management
**Decision:** Local component state instead of Redux
**Rationale:** Simpler, more explicit, easier to understand. Redux modal state can be removed entirely.

## State Management Changes

**Remove from Redux:**
- `modal` reducer
- `openModal` action
- `closeModal` action
- All modal-related types

**Keep in Redux (if still needed):**
- `auth` reducer

**Alternative:** Consider removing Redux entirely if auth is the only remaining state.

## Migration Strategy

### Phase 1: Create New Parallel Components
Don't delete existing code yet. Create new components alongside old ones.

```typescript
// NEW: Simple wrapper
export function BaseModal({ isOpen, onClose, title, children }) { }

// TEMP: Keep old implementation
export function BaseModalOld { /* existing 765-line implementation */ }
```

### Phase 2: Migrate One Form at a Time
1. Add mutation logic to a form component (start with simple ones like `CreateWalletForm`)
2. Add error handling
3. Update one page to use the new pattern
4. Test thoroughly
5. Repeat for other forms

**Order of migration (simplest to most complex):**
1. CreateWalletForm
2. EditWalletForm
3. AddTransactionForm
4. EditTransactionForm
5. TransferMoneyForm
6. Budget-related forms

### Phase 3: Update Pages Gradually
For each page that uses modals:
1. Add local state for modal open/close
2. Replace Redux modal dispatch with local state
3. Pass `onSuccess` callback to handle refetch + close
4. Remove from Redux modal state when fully migrated

### Phase 4: Clean Up
Once all pages are migrated:
1. Delete old `BaseModalOld.tsx`
2. Remove Redux modal reducer and actions
3. Consider removing Redux if only auth remains
4. Remove unused imports

## Benefits

1. **Maintainability:** Each form is self-contained, easier to understand and modify
2. **Testability:** Forms and mutations can be tested independently
3. **Reusability:** Forms can be used outside of modals (e.g., inline on pages)
4. **Simpler State:** No need for Redux modal management
5. **Clear Ownership:** Each form owns its logic, no shared monolithic component

## Trade-offs

1. **Some code duplication:** Each form will have similar mutation/error handling patterns
   - **Mitigation:** Can extract shared hooks later if pattern emerges

2. **More props to pass:** Pages need to pass `onSuccess` callbacks
   - **Mitigation:** Callback pattern is explicit and flexible

3. **Migration effort:** Need to update all pages using modals
   - **Mitigation:** Phased migration allows incremental progress

## Files to Modify

### Create New:
- `components/modals/baseModal.tsx` (new simplified version)

### Modify (all forms):
- `components/modals/forms/CreateWalletForm.tsx`
- `components/modals/forms/EditWalletForm.tsx`
- `components/modals/forms/AddTransactionForm.tsx`
- `components/modals/forms/EditTransactionForm.tsx`
- `components/modals/forms/TransferMoneyForm.tsx`
- `components/modals/forms/CreateBudgetForm.tsx`
- `components/modals/forms/EditBudgetForm.tsx`
- `components/modals/forms/CreateBudgetItemForm.tsx`
- `components/modals/forms/EditBudgetItemForm.tsx`

### Modify (pages that use modals):
- `app/dashboard/home/page.tsx`
- Any other pages that trigger modals

### Delete (after migration complete):
- Redux modal reducer and actions
- Old `BaseModal.tsx` (or rename to `BaseModalOld.tsx` during migration)

## Open Questions

None at this time.
