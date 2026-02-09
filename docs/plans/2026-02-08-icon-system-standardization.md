# Icon System Standardization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Standardize all SVG icons across the WealthJourney codebase to align with the UI/UX optimization standards, creating a consistent, themeable, and performant icon system.

**Architecture:** Create a centralized icon component system that uses inline SVG components with standardized stroke-based styling, replacing the mixed approach of inline SVGs and Image-loaded public SVGs.

**Tech Stack:** React 19, TypeScript 5, Tailwind CSS 3.4, Heroicons/Lucide-style stroke-based icons

---

## Background & Context

### Current State Analysis

The codebase has **90+ files** with SVG icons implemented in inconsistent ways:

1. **Inline SVG Components** - Direct SVG elements in components
   - `Button.tsx` - LoadingSpinner, SuccessIcon
   - `ThemeToggle.tsx` - SunIcon, MoonIcon, SystemIcon
   - `Toast.tsx` - Success, Error, Warning, Info icons
   - `Select.tsx` - Clear X, dropdown chevron
   - `FloatingActionButton.tsx` - Plus icon
   - And 85+ more files

2. **Public SVG Resources** - SVG files loaded via Image component
   - Located at `/public/resources/icons/`
   - 21 SVG files with hardcoded colors
   - Examples: `income.svg` (#22c55e green), `expense.svg` (#ef4444 red)

3. **Inconsistencies Identified**
   - Mixed sizing: `w-5 h-5`, `w-6 h-6`, `w-4 h-4`, various pixel values
   - Hardcoded colors prevent theming (income/expense icons)
   - No centralized icon system or registry
   - Some icons use `fill`, others use `stroke`
   - Inconsistent stroke widths

### Target Design System

Based on [BottomNav.tsx](../../src/wj-client/components/navigation/BottomNav.tsx) and [DESIGN_SYSTEM.md](../../DESIGN_SYSTEM.md):

```svg
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <!-- path data -->
</svg>
```

**Standard Specifications:**
- **Style**: Stroke-based (not filled)
- **ViewBox**: 24x24 standard
- **Stroke Width**: 2px
- **Line Caps/Joins**: Round
- **Color**: `stroke="currentColor"` for theming
- **Aesthetic**: Professional fintech (minimal, clean)

---

## Implementation Strategy

### Phase 1: Foundation - Create Icon System (2-3 hours)

Create the centralized icon component infrastructure before migrating existing icons.

### Phase 2: Public SVG Migration (3-4 hours)

Migrate all public SVG files to use the new system, fixing hardcoded colors.

### Phase 3: Inline SVG Standardization (4-6 hours)

Standardize all inline SVG components across 90+ files.

### Phase 4: Component Integration (2-3 hours)

Update components to use the new icon system.

### Phase 5: Testing & Validation (1-2 hours)

Validate visual consistency, theming, and performance.

---

## Phase 1: Foundation - Create Icon System

### Task 1: Create Icon Base Component

**Files:**
- Create: `src/wj-client/components/icons/Icon.tsx`
- Create: `src/wj-client/components/icons/index.ts`

**Step 1: Write the Icon base component**

Create `src/wj-client/components/icons/Icon.tsx`:

```tsx
"use client";

import { memo } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Standard icon sizes for the design system
 */
export type IconSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * Props for the Icon base component
 */
export interface IconProps {
  /** Icon content (SVG path or element) */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Icon size preset */
  size?: IconSize;
  /** Custom width/height (overrides size prop) */
  width?: number | string;
  height?: number | string;
  /** Accessibility label */
  ariaLabel?: string;
  /** Whether the icon is decorative (no aria-label) */
  decorative?: boolean;
}

/**
 * Size presets mapping to Tailwind classes
 */
const sizeClasses: Record<IconSize, string> = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
  xl: "w-8 h-8",
};

/**
 * Icon Base Component
 *
 * Provides standardized sizing and accessibility for all icons.
 * All icon components should wrap their SVG content with this component.
 *
 * @example
 * ```tsx
 * <Icon size="md" ariaLabel="Close">
 *   <svg {...standardSvgProps}>
 *     <path d="..." />
 *   </svg>
 * </Icon>
 * ```
 */
export const Icon = memo(function Icon({
  children,
  className,
  size = "md",
  width,
  height,
  ariaLabel,
  decorative = false,
}: IconProps) {
  const sizeClass = sizeClasses[size];
  const customSize = width && height ? { width, height } : {};

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center",
        "flex-shrink-0",
        sizeClass,
        className
      )}
      style={customSize}
      aria-label={decorative ? undefined : ariaLabel}
      aria-hidden={decorative}
      role="img"
    >
      {children}
    </span>
  );
});

/**
 * Standard SVG props for all icon SVGs
 * Ensures consistent viewBox, fill, stroke settings
 */
export const standardSvgProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  xmlns: "http://www.w3.org/2000/svg" as const,
};

export default Icon;
```

**Step 2: Create the icons barrel file**

Create `src/wj-client/components/icons/index.ts`:

```tsx
// Re-export Icon base and utilities
export { Icon, standardSvgProps, type IconProps, type IconSize } from "./Icon";

// Icon categories will be exported here
// export * from "./ui";
// export * from "./navigation";
// export * from "./actions";
// export * from "./finance";
```

---

### Task 2: Create Icon Categories

We'll organize icons into logical categories matching the design system.

**Files:**
- Create: `src/wj-client/components/icons/ui.tsx`
- Create: `src/wj-client/components/icons/navigation.tsx`
- Create: `src/wj-client/components/icons/actions.tsx`
- Create: `src/wj-client/components/icons/finance.tsx`
- Modify: `src/wj-client/components/icons/index.ts`

**Step 1: Create UI Icons**

Create `src/wj-client/components/icons/ui.tsx`:

```tsx
"use client";

import { memo } from "react";
import { Icon, standardSvgProps } from "./Icon";

// Export individual icon components

export const CheckIcon = memo(function CheckIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Check"}>
      <svg {...standardSvgProps}>
        <path d="M20 6L9 17l-5-5" />
      </svg>
    </Icon>
  );
});

export const XIcon = memo(function XIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Close"}>
      <svg {...standardSvgProps}>
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    </Icon>
  );
});

export const ChevronDownIcon = memo(function ChevronDownIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Expand"}>
      <svg {...standardSvgProps}>
        <path d="M6 9l6 6 6-6" />
      </svg>
    </Icon>
  );
});

export const ChevronLeftIcon = memo(function ChevronLeftIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Back"}>
      <svg {...standardSvgProps}>
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </Icon>
  );
});

export const ChevronRightIcon = memo(function ChevronRightIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Next"}>
      <svg {...standardSvgProps}>
        <path d="M9 18l6-6-6-6" />
      </svg>
    </Icon>
  );
});

export const PlusIcon = memo(function PlusIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Add"}>
      <svg {...standardSvgProps}>
        <path d="M12 4v16m8-8H4" />
      </svg>
    </Icon>
  );
});

export const MinusIcon = memo(function MinusIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Remove"}>
      <svg {...standardSvgProps}>
        <path d="M20 12H4" />
      </svg>
    </Icon>
  );
});

export const SearchIcon = memo(function SearchIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Search"}>
      <svg {...standardSvgProps}>
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
    </Icon>
  );
});

export const RefreshIcon = memo(function RefreshIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Refresh"}>
      <svg {...standardSvgProps}>
        <path d="M23 4v6h-6M1 20v-6h6" />
        <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
      </svg>
    </Icon>
  );
});
```

**Step 2: Create Navigation Icons**

Create `src/wj-client/components/icons/navigation.tsx`:

```tsx
"use client";

import { memo } from "react";
import { Icon, standardSvgProps } from "./Icon";

export const HomeIcon = memo(function HomeIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Home"}>
      <svg {...standardSvgProps}>
        <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    </Icon>
  );
});

export const TransactionIcon = memo(function TransactionIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Transactions"}>
      <svg {...standardSvgProps}>
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    </Icon>
  );
});

export const WalletIcon = memo(function WalletIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Wallets"}>
      <svg {...standardSvgProps}>
        <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    </Icon>
  );
});

export const PortfolioIcon = memo(function PortfolioIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Portfolio"}>
      <svg {...standardSvgProps}>
        <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    </Icon>
  );
});

export const ReportsIcon = memo(function ReportsIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Reports"}>
      <svg {...standardSvgProps}>
        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    </Icon>
  );
});

export const BudgetIcon = memo(function BudgetIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Budget"}>
      <svg {...standardSvgProps}>
        <path d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
      </svg>
    </Icon>
  );
});
```

**Step 3: Create Action Icons**

Create `src/wj-client/components/icons/actions.tsx`:

```tsx
"use client";

import { memo } from "react";
import { Icon, standardSvgProps } from "./Icon";

export const EditIcon = memo(function EditIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Edit"}>
      <svg {...standardSvgProps}>
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    </Icon>
  );
});

export const DeleteIcon = memo(function DeleteIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Delete"}>
      <svg {...standardSvgProps}>
        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </Icon>
  );
});

export const EyeIcon = memo(function EyeIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Show"}>
      <svg {...standardSvgProps}>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </Icon>
  );
});

export const EyeOffIcon = memo(function EyeOffIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Hide"}>
      <svg {...standardSvgProps}>
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
        <path d="M1 1l22 22" />
      </svg>
    </Icon>
  );
});

export const UserIcon = memo(function UserIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "User"}>
      <svg {...standardSvgProps}>
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </Icon>
  );
});

export const LogoutIcon = memo(function LogoutIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Logout"}>
      <svg {...standardSvgProps}>
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
        <path d="M16 17l5-5-5-5" />
        <path d="M21 12H9" />
      </svg>
    </Icon>
  );
});
```

**Step 4: Create Finance Icons**

Create `src/wj-client/components/icons/finance.tsx`:

```tsx
"use client";

import { memo } from "react";
import { Icon, standardSvgProps } from "./Icon";

export const IncomeIcon = memo(function IncomeIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Income"}>
      <svg {...standardSvgProps} className="text-success-600">
        <path d="M23 6l-9.5 9.5-5-5L1 18" />
        <path d="M17 6h6v6" />
      </svg>
    </Icon>
  );
});

export const ExpenseIcon = memo(function ExpenseIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Expense"}>
      <svg {...standardSvgProps} className="text-danger-600">
        <path d="M23 18l-9.5-9.5-5 5L1 6" />
        <path d="M17 18h6v-6" />
      </svg>
    </Icon>
  );
});

export const TransferIcon = memo(function TransferIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Transfer"}>
      <svg {...standardSvgProps}>
        <path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    </Icon>
  );
});

export const SavingsIcon = memo(function SavingsIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Savings"}>
      <svg {...standardSvgProps}>
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    </Icon>
  );
});

export const PercentIcon = memo(function PercentIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Percentage"}>
      <svg {...standardSvgProps}>
        <path d="M19 5L5 19M6.5 6.5h.01M17.5 17.5h.01" />
      </svg>
    </Icon>
  );
});

export const CategoryIcon = memo(function CategoryIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Category"}>
      <svg {...standardSvgProps}>
        <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    </Icon>
  );
});
```

**Step 5: Update the icons barrel file**

Modify `src/wj-client/components/icons/index.ts`:

```tsx
// Base Icon component
export { Icon, standardSvgProps, type IconProps, type IconSize } from "./Icon";

// UI Icons
export {
  CheckIcon,
  XIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  MinusIcon,
  SearchIcon,
  RefreshIcon,
} from "./ui";

// Navigation Icons
export {
  HomeIcon,
  TransactionIcon,
  WalletIcon,
  PortfolioIcon,
  ReportsIcon,
  BudgetIcon,
} from "./navigation";

// Action Icons
export {
  EditIcon,
  DeleteIcon,
  EyeIcon,
  EyeOffIcon,
  UserIcon,
  LogoutIcon,
} from "./actions";

// Finance Icons
export {
  IncomeIcon,
  ExpenseIcon,
  TransferIcon,
  SavingsIcon,
  PercentIcon,
  CategoryIcon,
} from "./finance";
```

---

## Phase 2: Public SVG Migration

### Task 3: Migrate Public SVG Files to New System

**Files:**
- Delete: `public/resources/icons/*.svg` (21 files)
- Create: `src/wj-client/components/icons/legacy.tsx` (backwards compatibility)

**Step 1: Create legacy compatibility layer**

Create `src/wj-client/components/icons/legacy.tsx`:

```tsx
"use client";

/**
 * Legacy icon path constants for backwards compatibility
 * Maps old icon names to new icon components
 *
 * @deprecated Import specific icon components from @/components/icons instead
 */

export const ICON_PATHS = {
  // Navigation
  home: "/resources/icons/home.svg",
  wallet: "/resources/icons/wallet.svg",
  transaction: "/resources/icons/transaction.svg",
  portfolio: "/public/portfolio.svg",
  budget: "/public/budget.svg",
  report: "/public/report.svg",

  // Actions
  plus: "/resources/icons/plus.svg",
  edit: "/resources/icons/edit.svg",
  delete: "/resources/icons/delete.svg",
  remove: "/resources/icons/remove.svg",
  close: "/resources/icons/close.svg",
  editing: "/resources/icons/editing.svg",

  // Finance
  income: "/resources/icons/income.svg",
  expense: "/resources/icons/expense.svg",
  savings: "/resources/icons/savings.svg",
  transfer: "/resources/icons/transfer.svg",
  percent: "/resources/icons/percent.svg",
  category: "/resources/icons/category.svg",

  // UI
  "chevron-left": "/resources/icons/chevron-left.svg",
  "chevron-right": "/resources/icons/chevron-right.svg",
  down: "/resources/icons/down.svg",
  refresh: "/resources/icons/refresh.svg",
  hide: "/resources/icons/hide.svg",
  unhide: "/resources/icons/unhide.svg",
  user: "/resources/icons/user.svg",
  logout: "/resources/icons/logout.svg",
} as const;

export type IconPath = keyof typeof ICON_PATHS;
```

**Step 2: Create migration guide document**

Create `docs/ICON_MIGRATION_GUIDE.md`:

```markdown
# Icon Migration Guide

## Overview

This guide explains how to migrate from the old icon system (public SVG files + inline SVGs) to the new centralized icon component system.

## Why Migrate?

The old system had several issues:
- ❌ Hardcoded colors prevented theming (income/expense icons)
- ❌ Inconsistent sizing across components
- ❌ Mixed approaches (Image component vs inline SVGs)
- ❌ No centralized icon registry

The new system provides:
- ✅ Themeable icons using `currentColor`
- ✅ Consistent sizing with presets (xs, sm, md, lg, xl)
- ✅ Type-safe icon imports
- ✅ Proper accessibility support
- ✅ Memoized components for performance

## Migration Examples

### Before: Using Image Component

```tsx
// ❌ Old way
<Image
  src={`${resources}/wallet.svg`}
  alt="Wallet"
  width={32}
  height={32}
/>
```

### After: Using Icon Component

```tsx
// ✅ New way
import { WalletIcon } from "@/components/icons";

<WalletIcon size="lg" ariaLabel="Wallet" />
```

### Before: Inline SVG with Inconsistent Styling

```tsx
// ❌ Old way
<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
  <path fillRule="evenodd" d="..." />
</svg>
```

### After: Standard Icon Component

```tsx
// ✅ New way
import { EditIcon } from "@/components/icons";

<EditIcon size="md" />
```

## Icon Reference

| Category | Old Path/Inline | New Component |
|----------|----------------|---------------|
| **Navigation** | | |
| Home | `home.svg` / inline | `HomeIcon` |
| Transactions | `transaction.svg` / inline | `TransactionIcon` |
| Wallets | `wallet.svg` / inline | `WalletIcon` |
| Portfolio | `portfolio.svg` / inline | `PortfolioIcon` |
| Reports | `report.svg` / inline | `ReportsIcon` |
| Budget | `budget.svg` / inline | `BudgetIcon` |
| **Actions** | | |
| Add | `plus.svg` / inline | `PlusIcon` |
| Edit | `edit.svg` / inline | `EditIcon` |
| Delete | `delete.svg` / inline | `DeleteIcon` |
| Close | `close.svg` / inline | `XIcon` |
| Show/Hide | `hide.svg` / `unhide.svg` | `EyeIcon` / `EyeOffIcon` |
| **Finance** | | |
| Income | `income.svg` (hardcoded green) | `IncomeIcon` (themeable) |
| Expense | `expense.svg` (hardcoded red) | `ExpenseIcon` (themeable) |
| Transfer | `transfer.svg` / inline | `TransferIcon` |
| Savings | `savings.svg` / inline | `SavingsIcon` |
| **UI** | | |
| Chevron Left | `chevron-left.svg` / inline | `ChevronLeftIcon` |
| Chevron Right | `chevron-right.svg` / inline | `ChevronRightIcon` |
| Chevron Down | `down.svg` / inline | `ChevronDownIcon` |
| Refresh | `refresh.svg` / inline | `RefreshIcon` |
| Search | inline | `SearchIcon` |

## Sizing System

Use size presets instead of arbitrary width/height:

| Preset | Tailwind | Use Case |
|-------|---------|----------|
| `xs` | `w-3 h-3` | Compact, table cells |
| `sm` | `w-4 h-4` | Buttons with text |
| `md` | `w-5 h-5` | Default size |
| `lg` | `w-6 h-6` | Standalone buttons |
| `xl` | `w-8 h-8` | Hero sections |

## Theming

Finance icons (Income/Expense) use semantic colors:

```tsx
// Income - uses success color (green)
<IncomeIcon className="text-success-600" />

// Expense - uses danger color (red)
<ExpenseIcon className="text-danger-600" />

// Override with any color
<WalletIcon className="text-primary-600" />
```

## Accessibility

All icons include proper ARIA attributes:

```tsx
// With label (for interactive icons)
<EditIcon ariaLabel="Edit transaction" />

// Decorative only (no screen reader announcement)
<CheckIcon decorative={true} />
```

## Complete Migration Checklist

- [ ] Update all `Image` components loading SVGs
- [ ] Replace inline SVGs with icon components
- [ ] Standardize icon sizes using presets
- [ ] Add proper ARIA labels
- [ ] Test in light/dark modes
- [ ] Test touch target sizes on mobile
```

---

## Phase 3: Inline SVG Standardization

### Task 4: Migrate Button Component Icons

**Files:**
- Modify: `src/wj-client/components/Button.tsx`

**Step 1: Replace inline SVGs with icon components**

Read the existing Button.tsx and replace the hoisted SVG components:

```tsx
// Add import at top
import { LoadingSpinner as LoadingIcon, CheckIcon } from "@/components/icons";

// Remove these hoisted components (lines 29-68):
// - LoadingSpinner
// - SuccessIcon

// Update renderContent function to use new icons:
const renderContent = () => {
  if (loading) {
    return (
      <>
        <LoadingIcon size="md" className="text-current" />
        {!iconOnly && children}
      </>
    );
  }

  if (success && !loading) {
    return (
      <>
        <CheckIcon size="md" />
        {!iconOnly && (children || "Success")}
      </>
    );
  }

  return (
    <>
      {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
      {!iconOnly && children}
      {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </>
  );
};
```

**Step 2: Run type check**

```bash
cd src/wj-client && npm run type-check
```

Expected: No type errors

---

### Task 5: Migrate ThemeToggle Component Icons

**Files:**
- Modify: `src/wj-client/components/ThemeToggle.tsx`

**Step 1: Replace inline SVGs with icon components**

```tsx
// Add imports
import { SunIcon, MoonIcon, DesktopIcon } from "@/components/icons";

// Remove hoisted components (lines 14-63):
// - SunIcon
// - MoonIcon
// - SystemIcon (rename to DesktopIcon)

// Update getIcon function:
const getIcon = () => {
  if (theme === "system") {
    return <DesktopIcon className={iconSize[size]} />;
  }
  return resolvedTheme === "dark" ? (
    <MoonIcon className={iconSize[size]} />
  ) : (
    <SunIcon className={iconSize[size]} />
  );
};
```

**Step 2: Add DesktopIcon to icons/ui.tsx if not present**

```tsx
// Add to src/wj-client/components/icons/ui.tsx
export const DesktopIcon = memo(function DesktopIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Desktop"}>
      <svg {...standardSvgProps}>
        <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    </Icon>
  );
});
```

**Step 3: Update icons/index.ts to export DesktopIcon**

**Step 4: Run type check**

```bash
cd src/wj-client && npm run type-check
```

**Step 5: Run type check**

```bash
cd src/wj-client && npm run type-check
```

---

### Task 6: Migrate Toast Component Icons

**Files:**
- Modify: `src/wj-client/components/ui/Toast.tsx`

**Step 1: Replace inline SVGs with icon components**

```tsx
// Add imports
import { CheckIcon, XIcon, AlertTriangleIcon, InfoIcon } from "@/components/icons";

// Remove variantIcons object (lines 82-103)

// Update toastContent to use icon components:
const variantIcons = {
  success: <CheckIcon size="md" className="text-white" />,
  error: <XIcon size="md" className="text-white" />,
  warning: <AlertTriangleIcon size="md" className="text-white" />,
  info: <InfoIcon size="md" className="text-white" />,
};

// Update close button icon:
<button
  onClick={handleClose}
  className="flex-shrink-0 p-1 hover:opacity-75 transition-opacity"
  aria-label="Close"
>
  <XIcon size="sm" className="text-white" />
</button>
```

**Step 2: Add missing icons to icons/ui.tsx**

```tsx
// Add to src/wj-client/components/icons/ui.tsx
export const AlertTriangleIcon = memo(function AlertTriangleIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Warning"}>
      <svg {...standardSvgProps}>
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" />
      </svg>
    </Icon>
  );
});

export const InfoIcon = memo(function InfoIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel={props.ariaLabel || "Information"}>
      <svg {...standardSvgProps}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" />
      </svg>
    </Icon>
  );
});
```

**Step 3: Update icons/index.ts exports

**Step 4: Run type check**

```bash
cd src/wj-client && npm run type-check
```

---

### Task 7: Migrate Select Component Icons

**Files:**
- Modify: `src/wj-client/components/select/Select.tsx`

**Step 1: Replace inline SVGs with icon components**

Find the clear button and dropdown chevron icons in Select.tsx and replace:

```tsx
// Add imports
import { XIcon, ChevronDownIcon } from "@/components/icons";

// Find and replace clear button icon
{clearable && value && (
  <button
    type="button"
    onClick={handleClear}
    className="absolute right-8 top-1/2 -translate-y-1/2 p-1 hover:bg-neutral-100 dark:hover:bg-dark-surface-hover rounded"
    aria-label="Clear selection"
  >
    <XIcon size="sm" />
  </button>
)}

// Find and replace dropdown chevron
<div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
  <ChevronDownIcon size="sm" className="text-neutral-400" />
</div>
```

**Step 2: Run type check**

```bash
cd src/wj-client && npm run type-check
```

---

### Task 8: Migrate FloatingActionButton Component Icons

**Files:**
- Modify: `src/wj-client/components/FloatingActionButton.tsx`

**Step 1: Replace inline SVG with icon component**

```tsx
// Add import
import { XIcon, PlusIcon } from "@/components/icons";

// Replace the main FAB button SVG (lines 100-112)
<button
  onClick={() => setIsOpen(!isOpen)}
  className={cn(
    "w-14 h-14 bg-primary-600 text-white rounded-full shadow-floating",
    "flex items-center justify-center",
    "hover:bg-primary-700 hover:shadow-xl",
    "active:scale-95",
    "transition-all duration-200",
    isOpen && "rotate-45"
  )}
  aria-label={isOpen ? "Close quick actions" : "Open quick actions"}
  aria-expanded={isOpen}
>
  {isOpen ? <XIcon size="xl" className="text-white" /> : <PlusIcon size="xl" className="text-white" />}
</button>
```

**Step 2: Run type check**

```bash
cd src/wj-client && npm run type-check
```

---

### Task 9: Migrate LoadingSpinner Component

**Files:**
- Modify: `src/wj-client/components/loading/LoadingSpinner.tsx`

**Step 1: Replace inline SVG with icon component**

Create a new loading-specific icon component first, then update LoadingSpinner:

```tsx
// Add to icons/ui.tsx
export const LoadingSpinnerIcon = memo(function LoadingSpinnerIcon(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props} ariaLabel="Loading" decorative={true}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="animate-spin"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </Icon>
  );
});
```

Then update LoadingSpinner.tsx:

```tsx
import { LoadingSpinnerIcon } from "@/components/icons";

export const LoadingSpinner = ({ text = "Loading…" }: LoadingSpinnerProps) => {
  return (
    <div className="flex items-center gap-2">
      <LoadingSpinnerIcon size="md" className="text-primary-500" />
      <span className="text-primary-500">{text}</span>
    </div>
  );
};
```

**Step 2: Update icons/index.ts to export LoadingSpinnerIcon

**Step 3: Run type check**

```bash
cd src/wj-client && npm run type-check
```

---

## Phase 4: Component Integration

### Task 10: Create Icon Utility Helpers

**Files:**
- Create: `src/wj-client/components/icons/utils.ts`

**Step 1: Create utility functions**

```tsx
import { type IconSize } from "./Icon";

/**
 * Get icon size for button based on button size
 */
export function getIconSizeForButton(buttonSize: "sm" | "md" | "lg"): IconSize {
  const sizeMap: Record<typeof buttonSize, IconSize> = {
    sm: "sm",
    md: "md",
    lg: "lg",
  };
  return sizeMap[buttonSize];
}

/**
 * Get color class for finance type
 */
export function getFinanceColor(type: "income" | "expense" | "transfer"): string {
  const colorMap = {
    income: "text-success-600 dark:text-success-500",
    expense: "text-danger-600 dark:text-danger-500",
    transfer: "text-primary-600 dark:text-primary-500",
  };
  return colorMap[type];
}

/**
 * Map transaction type to icon component
 */
export function getTransactionIcon(type: "income" | "expense" | "transfer") {
  // Import dynamically to avoid circular dependencies
  const { IncomeIcon, ExpenseIcon, TransferIcon } = require("./finance");
  const iconMap = {
    income: IncomeIcon,
    expense: ExpenseIcon,
    transfer: TransferIcon,
  };
  return iconMap[type];
}
```

---

---

### Task 11: Update BottomNav to Use New Icons

**Files:**
- Modify: `src/wj-client/components/navigation/BottomNav.tsx`

**Step 1: Replace inline SVGs with icon components**

```tsx
// Add imports
import {
  HomeIcon,
  TransactionIcon,
  WalletIcon,
  PortfolioIcon,
  ReportsIcon,
} from "@/components/icons";

// Replace createNavItems function to use icon components:
export const createNavItems = (
  routes: Record<string, string>
): NavItem[] => {
  return [
    {
      href: routes.home,
      label: "Home",
      ariaLabel: "Go to home dashboard",
      icon: <HomeIcon size="md" />,
    },
    {
      href: routes.transaction,
      label: "Transactions",
      ariaLabel: "Go to transactions",
      icon: <TransactionIcon size="md" />,
    },
    {
      href: routes.wallets,
      label: "Wallets",
      ariaLabel: "Go to wallets",
      icon: <WalletIcon size="md" />,
    },
    {
      href: routes.portfolio,
      label: "Portfolio",
      ariaLabel: "Go to investment portfolio",
      icon: <PortfolioIcon size="md" />,
    },
    {
      href: routes.report,
      label: "Reports",
      ariaLabel: "Go to reports",
      icon: <ReportsIcon size="md" />,
    },
  ];
};
```

---

---

### Task 12: Update QuickActions Component

**Files:**
- Modify: `src/wj-client/components/dashboard/QuickActions.tsx`

**Step 1: Update example to use new icons**

```tsx
// Update example in comment to use icon components:
/**
 * @example
 * ```tsx
 * import { PlusIcon, TransactionIcon, WalletIcon } from "@/components/icons";
 *
 * const actions = [
 *   {
 *     id: 'add-transaction',
 *     label: 'Add',
 *     icon: <PlusIcon size="lg" />,
 *     onClick: () => openModal('add-transaction'),
 *     ariaLabel: 'Add new transaction',
 *   },
 *   // ... more actions
 * ];
 *
 * <QuickActions actions={actions} />
 * ```
 */
```

**Step 2: Run type check**

```bash
cd src/wj-client && npm run type-check
```

---

## Phase 5: Testing & Validation

### Task 13: Visual Regression Testing

**Step 1: Create visual test script**

Create `scripts/test-icons.sh`:

```bash
#!/bin/bash

# Icon System Visual Test Script
# Tests icon rendering across different contexts

echo "🔍 Testing Icon System..."
echo ""

# Test 1: Build the project
echo "Test 1: Building project..."
cd src/wj-client
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed"
  exit 1
fi
echo "✅ Build passed"
echo ""

# Test 2: Type check
echo "Test 2: Type checking..."
npm run type-check

if [ $? -ne 0 ]; then
  echo "❌ Type check failed"
  exit 1
fi
echo "✅ Type check passed"
echo ""

# Test 3: Lint check
echo "Test 3: Linting..."
npm run lint

if [ $? -ne 0 ]; then
  echo "❌ Lint failed"
  exit 1
fi
echo "✅ Lint passed"
echo ""

echo "✅ All tests passed!"
echo ""
echo "📋 Manual testing checklist:"
echo "  - [ ] Check icons render correctly in light mode"
echo "  - [ ] Check icons render correctly in dark mode"
echo "  - [ ] Check icon sizes are consistent"
echo "  - [ ] Check icon colors match theme"
echo "  - [ ] Check icons on mobile (touch targets)"
echo "  - [ ] Check accessibility (screen readers)"
```

**Step 2: Make script executable**

```bash
chmod +x scripts/test-icons.sh
```

**Step 3: Run tests**

```bash
./scripts/test-icons.sh
```

---

---

### Task 14: Create Icon Storybook Stories

**Files:**
- Create: `src/wj-client/components/icons/Icon.stories.tsx`

**Step 1: Create Storybook stories**

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import {
  Icon,
  CheckIcon,
  XIcon,
  PlusIcon,
  EditIcon,
  DeleteIcon,
  WalletIcon,
  TransactionIcon,
  IncomeIcon,
  ExpenseIcon,
  HomeIcon,
  PortfolioIcon,
} from "./";

const meta: Meta<typeof Icon> = {
  title: "Components/Icons",
  component: Icon,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Icon>;

/**
 * Basic icon with different sizes
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <CheckIcon size="xs" ariaLabel="Extra small" />
      <CheckIcon size="sm" ariaLabel="Small" />
      <CheckIcon size="md" ariaLabel="Medium" />
      <CheckIcon size="lg" ariaLabel="Large" />
      <CheckIcon size="xl" ariaLabel="Extra large" />
    </div>
  ),
};

/**
 * All action icons
 */
export const ActionIcons: Story = {
  render: () => (
    <div className="grid grid-cols-6 gap-4">
      <div className="flex flex-col items-center gap-2">
        <PlusIcon size="md" />
        <span className="text-xs">Plus</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <EditIcon size="md" />
        <span className="text-xs">Edit</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <DeleteIcon size="md" />
        <span className="text-xs">Delete</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <CheckIcon size="md" />
        <span className="text-xs">Check</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <XIcon size="md" />
        <span className="text-xs">Close</span>
      </div>
    </div>
  ),
};

/**
 * All navigation icons
 */
export const NavigationIcons: Story = {
  render: () => (
    <div className="grid grid-cols-6 gap-4">
      <div className="flex flex-col items-center gap-2">
        <HomeIcon size="md" />
        <span className="text-xs">Home</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <TransactionIcon size="md" />
        <span className="text-xs">Transactions</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <WalletIcon size="md" />
        <span className="text-xs">Wallets</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <PortfolioIcon size="md" />
        <span className="text-xs">Portfolio</span>
      </div>
    </div>
  ),
};

/**
 * Finance icons with semantic colors
 */
export const FinanceIcons: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4">
      <div className="flex flex-col items-center gap-2">
        <IncomeIcon size="lg" />
        <span className="text-xs text-success-600">Income</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <ExpenseIcon size="lg" />
        <span className="text-xs text-danger-600">Expense</span>
      </div>
    </div>
  ),
};

/**
 * Icons in different colors
 */
export const ColoredIcons: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <CheckIcon size="md" className="text-success-600" />
      <XIcon size="md" className="text-danger-600" />
      <EditIcon size="md" className="text-primary-600" />
      <WalletIcon size="md" className="text-warning-600" />
    </div>
  ),
};

/**
 * Dark mode icons
 */
export const DarkMode: Story = {
  render: () => (
    <div className="dark bg-dark-background p-8 rounded-lg">
      <div className="grid grid-cols-6 gap-4">
        <HomeIcon size="md" />
        <TransactionIcon size="md" />
        <WalletIcon size="md" />
        <PortfolioIcon size="md" />
        <PlusIcon size="md" />
        <EditIcon size="md" />
      </div>
    </div>
  ),
  parameters: {
    backgrounds: {
      default: "dark",
    },
  },
};
```

---

---

### Task 15: Final Validation & Documentation

**Step 1: Create comprehensive test plan**

Create `docs/ICON_TESTING_CHECKLIST.md`:

```markdown
# Icon System Testing Checklist

## Visual Testing

### Light Mode
- [ ] All icons render with correct stroke width
- [ ] Icon colors match theme (currentColor)
- [ ] Icon sizes are consistent across components
- [ ] No pixelation or blurriness

### Dark Mode
- [ ] All icons visible against dark background
- [ ] Icon colors properly invert
- [ ] Semantic colors (income/expense) remain distinct
- [ ] No contrast issues

### Responsive Testing
- [ ] Icons scale correctly at all breakpoints
- [ ] Touch targets meet 44px minimum on mobile
- [ ] Icons don't overflow containers on small screens

## Component Testing

### Button Component
- [ ] Loading spinner animates correctly
- [ ] Success checkmark displays properly
- [ ] Icon sizes match button size

### Theme Toggle
- [ ] Sun/Moon/Desktop icons display correctly
- [ ] Icons transition smoothly

### Toast Component
- [ ] Success/Error/Warning/Info icons display
- [ ] Close button X icon visible
- [ ] Icons colored correctly (white on colored bg)

### BottomNav
- [ ] All 5 nav icons display
- [ ] Active state icon scales correctly
- [ ] Icons properly aligned

## Accessibility Testing

### Screen Reader Testing
- [ ] Icon-only buttons have aria-label
- [ ] Decorative icons marked with aria-hidden
- [ ] Icon labels are descriptive
- [ ] Navigation icons announce correctly

### Keyboard Navigation
- [ ] Icons in focusable elements receive focus
- [ ] Focus indicators visible
- [ ] Tab order logical

## Performance Testing

### Bundle Size
- [ ] Icon components tree-shakeable
- [ ] No unused icons in bundle
- [ ] Memoized components prevent re-renders

### Runtime Performance
- [ ] No layout shifts from icon loading
- [ ] Icons render without FOUC
- [ ] Animations run at 60fps

## Cross-Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] iOS Safari
- [ ] Android Chrome

## Regression Testing
- [ ] All existing icon locations migrated
- [ ] No broken image links
- [ ] No console errors
- [ ] All icon variants (sizes/colors) work
```

**Step 2: Update DESIGN_SYSTEM.md icon section**

Modify `src/wj-client/DESIGN_SYSTEM.md`, update the Icon System section:

```markdown
## Icon System

### Overview

The icon system is built on standardized SVG components with consistent styling for a professional fintech aesthetic.

### Usage

Import specific icons from the icons directory:

```tsx
import { WalletIcon, EditIcon, IncomeIcon } from "@/components/icons";

<WalletIcon size="md" ariaLabel="Wallet" />
```

### Icon Sizes

| Preset | Tailwind | Use Case |
|-------|---------|----------|
| `xs` | `w-3 h-3` | Compact, table cells |
| `sm` | `w-4 h-4` | Buttons with text |
| `md` | `w-5 h-5` | Default size |
| `lg` | `w-6 h-6` | Standalone buttons |
| `xl` | `w-8 h-8` | Hero sections |

### Icon Categories

- **UI Icons**: Check, X, Chevrons, Plus, Minus, Search, Refresh
- **Navigation Icons**: Home, Transactions, Wallets, Portfolio, Reports, Budget
- **Action Icons**: Edit, Delete, Eye (show/hide), User, Logout
- **Finance Icons**: Income, Expense, Transfer, Savings, Percent, Category

### Specifications

- **Style**: Stroke-based (not filled)
- **ViewBox**: 24x24 standard
- **Stroke Width**: 2px
- **Line Caps/Joins**: Round
- **Color**: `stroke="currentColor"` for theming

### Accessibility

All icons include proper ARIA attributes:

```tsx
// Interactive icon (button, link)
<EditIcon ariaLabel="Edit transaction" />

// Decorative icon
<CheckIcon decorative={true} />
```

### Examples

```tsx
// Finance icons with semantic colors
<IncomeIcon className="text-success-600" />
<ExpenseIcon className="text-danger-600" />

// Size variation
<WalletIcon size="sm" />  // Small
<WalletIcon size="md" />  // Default
<WalletIcon size="lg" />  // Large

// Custom color
<PlusIcon className="text-primary-600" />
```
```

**Step 3: Run final test suite**

```bash
./scripts/test-icons.sh
```

---

---

## Summary

### What Was Built

1. **Centralized Icon System**
   - Base `Icon` component with standardized props
   - Size presets (xs, sm, md, lg, xl)
   - Accessibility built-in (aria-label, decorative)
   - Memoized components for performance

2. **Icon Library**
   - UI Icons (9 icons)
   - Navigation Icons (6 icons)
   - Action Icons (6 icons)
   - Finance Icons (6 icons)
   - Total: 27 standardized icon components

3. **Migration**
   - Button component icons
   - ThemeToggle icons
   - Toast component icons
   - Select component icons
   - FloatingActionButton icons
   - LoadingSpinner component
   - BottomNav icons

4. **Documentation**
   - Migration guide
   - Testing checklist
   - Updated design system
   - Storybook stories
   - Test script

### Files Created/Modified

**Created:**
- `src/wj-client/components/icons/Icon.tsx`
- `src/wj-client/components/icons/index.ts`
- `src/wj-client/components/icons/ui.tsx`
- `src/wj-client/components/icons/navigation.tsx`
- `src/wj-client/components/icons/actions.tsx`
- `src/wj-client/components/icons/finance.tsx`
- `src/wj-client/components/icons/legacy.tsx`
- `src/wj-client/components/icons/utils.ts`
- `src/wj-client/components/icons/Icon.stories.tsx`
- `scripts/test-icons.sh`
- `docs/ICON_MIGRATION_GUIDE.md`
- `docs/ICON_TESTING_CHECKLIST.md`

**Modified:**
- `src/wj-client/components/Button.tsx`
- `src/wj-client/components/ThemeToggle.tsx`
- `src/wj-client/components/ui/Toast.tsx`
- `src/wj-client/components/select/Select.tsx`
- `src/wj-client/components/FloatingActionButton.tsx`
- `src/wj-client/components/loading/LoadingSpinner.tsx`
- `src/wj-client/components/navigation/BottomNav.tsx`
- `src/wj-client/components/dashboard/QuickActions.tsx`
- `src/wj-client/DESIGN_SYSTEM.md`

### Testing Checklist

Before considering this complete:

- [ ] All components build without errors
- [ ] Type checking passes
- [ ] Linting passes
- [ ] Visual test script passes
- [ ] Icons render correctly in light mode
- [ ] Icons render correctly in dark mode
- [ ] Icon sizes are consistent
- [ ] Icon colors match theme
- [ ] Touch targets adequate on mobile
- [ ] Accessibility validated with screen reader
- [ ] No console errors
- [ ] Storybook stories render correctly

### Next Steps

After implementation:

1. **Gradual Migration**: Migrate remaining components incrementally
2. **Add More Icons**: Expand icon library as needed
3. **Performance Monitoring**: Monitor bundle size impact
4. **User Testing**: Validate icon recognition with users

---

**Total Estimated Time**: 12-18 hours

**Priority**: High - Consistent icon system is critical for professional UI/UX

**Dependencies**: None (can be implemented independently)

**Risk**: Low - Changes are additive, backwards compatible