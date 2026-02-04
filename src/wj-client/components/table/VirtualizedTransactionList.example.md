# VirtualizedTransactionList Component

## Overview

The `VirtualizedTransactionList` component provides high-performance rendering for large transaction datasets using react-window's `VariableSizeList`. It only renders visible rows, making it ideal for datasets with 100+ items.

## Features

- **Variable Row Heights**: Automatically adjusts row height based on content (especially long notes)
- **Scroll Position Restoration**: Maintains scroll position during data updates
- **Smooth Scrolling**: Optimized for 100+ items with consistent 60fps performance
- **Automatic Fallback**: Uses regular table rendering for small datasets (< 20 items)
- **Loading States**: Built-in skeleton loading state
- **Empty States**: Customizable empty state messages
- **TypeScript Support**: Fully typed with TypeScript

## Installation

The component requires `react-window` and its TypeScript types:

```bash
npm install react-window @types/react-window
```

## Basic Usage

### Automatic Usage (via TransactionTable)

The easiest way to use virtualization is through the updated `TransactionTable` component, which automatically switches to virtualized rendering for 20+ items:

```tsx
import { TransactionTable } from "./TransactionTable";

function TransactionPage() {
  const { data: transactionsData, isLoading } = useQueryListTransactions(
    { pagination: { page: 1, pageSize: 100, orderBy: "date", order: "desc" } },
    { refetchOnMount: "always" }
  );

  return (
    <TransactionTable
      transactions={transactionsData?.transactions || []}
      getCategoryName={getCategoryName}
      getWalletName={getWalletName}
      onEdit={handleEdit}
      onDelete={handleDelete}
      isLoading={isLoading}
      className="overflow-auto flex-1 min-h-0"
      // Virtualization is enabled by default for 20+ items
      enableVirtualization={true}
      virtualizedHeight="calc(100vh - 350px)"
    />
  );
}
```

### Direct Usage with VirtualizedTransactionList

For more control, use the component directly:

```tsx
import {
  VirtualizedTransactionList,
  useTransactionDisplayData,
} from "@/components/table/VirtualizedTransactionList";

function MyTransactionList() {
  const { data: transactionsData, isLoading } = useQueryListTransactions(...);
  const transactions = transactionsData?.transactions || [];

  // Convert Transaction objects to display data
  const displayData = useTransactionDisplayData(
    transactions,
    getCategoryName,
    getWalletName,
    formatCurrency,
    currency
  );

  return (
    <VirtualizedTransactionList
      transactions={displayData}
      actions={{
        onEdit: handleEdit,
        onDelete: handleDelete,
      }}
      isLoading={isLoading}
      height={500} // or "50vh", "calc(100vh - 350px)"
      estimatedRowHeight={60}
      minRowHeight={60}
      maxRowHeight={200}
      restoreScroll={true}
    />
  );
}
```

## Props

### VirtualizedTransactionList

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `transactions` | `TransactionDisplayData[]` | **required** | Array of transaction data to display |
| `actions` | `TransactionActions` | **required** | Edit and delete callbacks |
| `height` | `number \| string` | **required** | Container height (e.g., 500, "50vh", "calc(100vh - 350px)") |
| `isLoading` | `boolean` | `false` | Show loading skeleton |
| `className` | `string` | `""` | Additional CSS classes |
| `estimatedRowHeight` | `number` | `60` | Default row height for initial render |
| `minRowHeight` | `number` | `60` | Minimum row height in pixels |
| `maxRowHeight` | `number` | `200` | Maximum row height (for long notes) |
| `restoreScroll` | `boolean` | `true` | Maintain scroll position during updates |
| `renderRow` | `(props) => ReactNode` | `undefined` | Custom row renderer |

### TransactionTable (Updated)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `transactions` | `Transaction[]` | **required** | Array of Transaction objects |
| `getCategoryName` | `(id: number) => string` | **required** | Get category name by ID |
| `getWalletName` | `(id: number) => string` | **required** | Get wallet name by ID |
| `onEdit` | `(id: number) => void` | **required** | Edit callback |
| `onDelete` | `(id: number) => void` | **required** | Delete callback |
| `isLoading` | `boolean` | `false` | Show loading state |
| `className` | `string` | `""` | Additional CSS classes |
| `enableVirtualization` | `boolean` | `true` | Enable virtualization for 20+ items |
| `virtualizedHeight` | `number \| string` | `"calc(100vh - 350px)"` | Height of virtualized list |

## Data Format

### TransactionDisplayData

```typescript
interface TransactionDisplayData {
  id: number;
  category: string;
  wallet: string;
  amount: string;
  amountColor?: string; // Optional color for amount (e.g., "text-danger-600" for expenses)
  date: string;
  note?: string;
}
```

### TransactionActions

```typescript
interface TransactionActions {
  onEdit: (transactionId: number) => void;
  onDelete: (transactionId: number) => void;
}
```

## Helper Hook

### useTransactionDisplayData

Converts Transaction objects to TransactionDisplayData format:

```tsx
const displayData = useTransactionDisplayData(
  transactions, // Your Transaction array
  getCategoryName, // (id: number) => string
  getWalletName,  // (id: number) => string
  formatCurrency, // (amount: number, currency: string) => string
  currency // Display currency (e.g., "VND")
);
```

## Responsive Behavior

The component automatically adjusts for different screen sizes:

- **Mobile (< 640px)**: Shows category, amount, and actions
- **Tablet (640px - 768px)**: Adds date column
- **Desktop (768px - 1024px)**: Adds wallet column
- **Large Desktop (> 1024px)**: Shows all columns including note

## Performance Characteristics

| Dataset Size | Rendering Method | Performance |
|--------------|------------------|-------------|
| < 20 items | Regular table | Excellent |
| 20-100 items | Virtualized list | Excellent |
| 100-1000 items | Virtualized list | Good |
| 1000+ items | Virtualized list | Acceptable |

**Memory Usage**: O(viewport size) instead of O(total items)

**Render Time**: Constant regardless of total items

## Examples

### Custom Row Renderer

```tsx
const CustomRow = ({ index, style, data }: ListChildComponentProps) => {
  const transaction = data.transactions[index];

  return (
    <div style={style} className="custom-row">
      <span>{transaction.category}</span>
      <span>{transaction.amount}</span>
    </div>
  );
};

<VirtualizedTransactionList
  transactions={displayData}
  actions={actions}
  height={500}
  renderRow={CustomRow}
/>
```

### Responsive Height

```tsx
// Fixed pixel height
<VirtualizedTransactionList height={400} {...otherProps} />

// Viewport-relative height
<VirtualizedTransactionList height="50vh" {...otherProps} />

// Calculated height
<VirtualizedTransactionList
  height="calc(100vh - 350px)"
  {...otherProps}
/>
```

### Disable Virtualization

```tsx
<TransactionTable
  {...props}
  enableVirtualization={false} // Always use regular table
/>
```

## Troubleshooting

### Scroll Position Jumps

If scroll position jumps during updates, ensure `restoreScroll` is enabled (default):

```tsx
<VirtualizedTransactionList restoreScroll={true} {...otherProps} />
```

### Row Height Issues

If row heights are incorrect, adjust the `estimatedRowHeight`, `minRowHeight`, and `maxRowHeight` props:

```tsx
<VirtualizedTransactionList
  estimatedRowHeight={80} // Better estimate for your data
  minRowHeight={60}
  maxRowHeight={300} // Allow more space for long notes
  {...otherProps}
/>
```

### Performance Still Poor

1. Ensure you're not re-creating the `actions` object on every render:
   ```tsx
   // Good
   const actions = useMemo(() => ({ onEdit, onDelete }), [onEdit, onDelete]);

   // Bad
   actions={{ onEdit, onDelete }} // Creates new object every render
   ```

2. Use the `useTransactionDisplayData` hook to memoize data transformation

3. Check React DevTools Profiler to identify other performance bottlenecks

## Migration Guide

### From Regular Table

**Before:**
```tsx
<TanStackTable data={transactions} columns={columns} />
```

**After:**
```tsx
<TransactionTable
  transactions={transactions}
  getCategoryName={getCategoryName}
  getWalletName={getWalletName}
  onEdit={handleEdit}
  onDelete={handleDelete}
  enableVirtualization={true} // Just add this prop!
/>
```

The component automatically handles the switch between regular and virtualized rendering based on data size.

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Full support

## Accessibility

- Keyboard navigation supported
- ARIA labels on action buttons
- Semantic table structure when not virtualized
- Minimum touch target size (44x44px) maintained

## License

MIT
