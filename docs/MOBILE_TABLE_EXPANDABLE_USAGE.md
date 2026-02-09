# MobileTable Expandable Rows - Usage Guide

## Overview

The `MobileTable` component now supports expandable rows, allowing you to show a compact view by default and let users expand rows to see more details. This follows the UI/UX optimization plan (section 2.5) for better mobile experience.

## Features

- **Collapsed View**: Show only key information (transaction name, date, amount)
- **Expanded View**: Show all additional fields (category, wallet, note, etc.)
- **Smooth Animations**: Fade-in and slide-in effects for expanded content
- **Accessibility**: Proper ARIA attributes for screen readers
- **Customizable Labels**: Configure expand/collapse button text

## Basic Usage

### 1. Define Columns with `showInCollapsed` Property

```tsx
import { MobileColumnDef } from "@/components/table/MobileTable";

const columns: MobileColumnDef<Transaction>[] = [
  // These columns will be shown in collapsed view (key info)
  {
    id: 'name',
    header: 'Transaction',
    accessorKey: 'name',
    showInCollapsed: true, // Show in collapsed view
  },
  {
    id: 'date',
    header: 'Date',
    accessorFn: (row) => formatDate(row.date),
    showInCollapsed: true, // Show in collapsed view
  },
  {
    id: 'amount',
    header: 'Amount',
    accessorFn: (row) => formatCurrency(row.amount),
    showInCollapsed: true, // Show in collapsed view
  },

  // These columns will only be shown when expanded
  {
    id: 'category',
    header: 'Category',
    accessorFn: (row) => getCategoryName(row.categoryId),
    showInCollapsed: false, // Only show when expanded
  },
  {
    id: 'wallet',
    header: 'Wallet',
    accessorFn: (row) => getWalletName(row.walletId),
    showInCollapsed: false, // Only show when expanded
  },
  {
    id: 'note',
    header: 'Note',
    accessorKey: 'note',
    showInCollapsed: false, // Only show when expanded
  },
];
```

### 2. Enable Expandable Rows

```tsx
<MobileTable
  data={transactions}
  columns={columns}
  expandable={true} // Enable expandable rows
  expandButtonLabel="Details" // Optional: customize expand button text
  collapseButtonLabel="Less" // Optional: customize collapse button text
  renderActions={(row) => (
    <button onClick={() => handleEdit(row.id)}>Edit</button>
  )}
/>
```

## Complete Example

```tsx
"use client";

import { MobileTable, MobileColumnDef } from "@/components/table/MobileTable";
import { formatCurrency } from "@/utils/currency-formatter";
import { format } from "date-fns";

interface Transaction {
  id: number;
  name: string;
  amount: number;
  date: Date;
  categoryId: number;
  categoryName: string;
  walletId: number;
  walletName: string;
  note?: string;
}

export function TransactionListMobile({ transactions }: { transactions: Transaction[] }) {
  const columns: MobileColumnDef<Transaction>[] = [
    // Collapsed view - key info only
    {
      id: 'name',
      header: 'Transaction',
      accessorKey: 'name',
      showInCollapsed: true,
    },
    {
      id: 'date',
      header: 'Date',
      accessorFn: (row) => format(new Date(row.date), 'MMM dd, yyyy'),
      showInCollapsed: true,
    },
    {
      id: 'amount',
      header: 'Amount',
      accessorFn: (row) => formatCurrency(row.amount, 'VND'),
      showInCollapsed: true,
    },

    // Expanded view - additional details
    {
      id: 'category',
      header: 'Category',
      accessorKey: 'categoryName',
      showInCollapsed: false,
    },
    {
      id: 'wallet',
      header: 'Wallet',
      accessorKey: 'walletName',
      showInCollapsed: false,
    },
    {
      id: 'note',
      header: 'Note',
      accessorKey: 'note',
      showInCollapsed: false,
    },
  ];

  return (
    <MobileTable
      data={transactions}
      columns={columns}
      expandable={true}
      expandButtonLabel="View Details"
      collapseButtonLabel="Hide Details"
      getKey={(item) => item.id}
      renderActions={(row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(row.id)}
            className="text-primary-600 hover:text-primary-700"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="text-danger-600 hover:text-danger-700"
          >
            Delete
          </button>
        </div>
      )}
    />
  );
}
```

## Props Reference

### New Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `expandable` | `boolean` | `false` | Enable expandable rows functionality |
| `expandButtonLabel` | `string` | `"Details"` | Text for the expand button |
| `collapseButtonLabel` | `string` | `"Less"` | Text for the collapse button |

### MobileColumnDef Updates

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `showInCollapsed` | `boolean` | `true` | If `true`, column is shown in collapsed view. If `false`, only shown when expanded |

## Behavior

1. **Default State**: All rows start in collapsed state
2. **Individual Expansion**: Each row can be expanded/collapsed independently
3. **No Expandable Content**: If all columns have `showInCollapsed: true` (or undefined), the expand button won't be shown
4. **Animation**: Expanded content slides in with a smooth fade animation (200ms duration)
5. **Loading State**: Loading skeleton adapts to show only collapsed columns when expandable is enabled

## Best Practices

### 1. Choose Key Information Wisely

Show the most important information in the collapsed view (3-4 fields max):
- Primary identifier (name, title)
- Date/time
- Amount or status
- Action button

### 2. Group Related Details in Expanded View

Put supplementary information in the expanded view:
- Categories and tags
- Descriptions and notes
- Secondary amounts
- Metadata (created by, updated at, etc.)

### 3. Don't Overload Expanded View

Keep expanded content focused (5-7 fields max). If you need to show more, consider a detail modal instead.

### 4. Use Semantic Button Labels

Choose clear, action-oriented labels:
- ✅ "View Details", "Show More", "See Full Info"
- ❌ "Expand", "Click Here", "Open"

### 5. Consider Touch Targets

The expand button meets WCAG minimum touch target size (44x44px equivalent) with padding and hover states.

## Migration Guide

### Before (Non-Expandable)

```tsx
const columns: MobileColumnDef<Transaction>[] = [
  { id: 'name', header: 'Transaction', accessorKey: 'name' },
  { id: 'date', header: 'Date', accessorFn: (row) => formatDate(row.date) },
  { id: 'amount', header: 'Amount', accessorFn: (row) => formatCurrency(row.amount) },
  { id: 'category', header: 'Category', accessorKey: 'categoryName' },
  { id: 'wallet', header: 'Wallet', accessorKey: 'walletName' },
  { id: 'note', header: 'Note', accessorKey: 'note' },
];

<MobileTable data={transactions} columns={columns} />
```

### After (Expandable)

```tsx
const columns: MobileColumnDef<Transaction>[] = [
  // Add showInCollapsed to control visibility
  { id: 'name', header: 'Transaction', accessorKey: 'name', showInCollapsed: true },
  { id: 'date', header: 'Date', accessorFn: (row) => formatDate(row.date), showInCollapsed: true },
  { id: 'amount', header: 'Amount', accessorFn: (row) => formatCurrency(row.amount), showInCollapsed: true },
  { id: 'category', header: 'Category', accessorKey: 'categoryName', showInCollapsed: false },
  { id: 'wallet', header: 'Wallet', accessorKey: 'walletName', showInCollapsed: false },
  { id: 'note', header: 'Note', accessorKey: 'note', showInCollapsed: false },
];

<MobileTable
  data={transactions}
  columns={columns}
  expandable={true}
  expandButtonLabel="Details"
  collapseButtonLabel="Less"
/>
```

## Accessibility

The expandable functionality includes proper accessibility attributes:

- **ARIA Label**: `aria-label` describes the action (expand/collapse)
- **ARIA Expanded**: `aria-expanded` indicates the current state
- **Keyboard Support**: Button is focusable and activatable with Enter/Space
- **Visual Feedback**: Hover and focus states for better UX

## Animation Details

The expanded content uses Tailwind's animation utilities:
- `animate-in`: Base animation class
- `fade-in`: Opacity transition
- `slide-in-from-top-2`: Vertical slide (8px)
- `duration-200`: 200ms transition

## Related Documentation

- [UI/UX Optimization Plan](./UI_UX_OPTIMIZATION_PLAN.md) - Section 2.5
- [MobileTable Component](../src/wj-client/components/table/MobileTable.tsx)
- [CLAUDE.md](../.claude/CLAUDE.md) - Mobile Table Pattern
