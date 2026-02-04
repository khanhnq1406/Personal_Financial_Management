# Loading Components

This directory contains loading state components for the WealthJourney application.

## Skeleton Components

Skeleton screens provide better user experience than simple spinners by showing content placeholders while data is loading.

### Base Components

#### `Skeleton`
Base skeleton component for custom loading states.

```tsx
import { Skeleton } from "@/components/loading/Skeleton";

<Skeleton className="h-4 w-32" />
```

#### `CardSkeleton`
Loading state for card components.

```tsx
import { CardSkeleton } from "@/components/loading/Skeleton";

// Usage in a component
{isLoading ? <CardSkeleton /> : <ActualCard data={data} />}
```

#### `TableSkeleton`
Loading state for table/list views with configurable row count.

```tsx
import { TableSkeleton } from "@/components/loading/Skeleton";

// Default 5 rows
{isLoading ? <TableSkeleton /> : <Table data={data} />}

// Custom row count
{isLoading ? <TableSkeleton rows={10} /> : <Table data={data} />}
```

#### `ListSkeleton`
Loading state for simple list views.

```tsx
import { ListSkeleton } from "@/components/loading/Skeleton";

// Default 5 items
{isLoading ? <ListSkeleton /> : <List items={items} />}

// Custom item count
{isLoading ? <ListSkeleton items={8} /> : <List items={items} />}
```

#### `TextSkeleton`
Loading state for text content.

```tsx
import { TextSkeleton } from "@/components/loading/Skeleton";

// Default 3 lines
{isLoading ? <TextSkeleton /> : <p>{content}</p>}

// Custom line count
{isLoading ? <TextSkeleton lines={5} /> : <p>{content}</p>}
```

### Specialized Skeletons

The following skeletons are kept for backward compatibility with existing code:

- `WalletListSkeleton` - For wallet lists
- `ChartSkeleton` - For chart components
- `TotalBalanceSkeleton` - For balance displays
- `UserSkeleton` - For user profile displays

### Other Loading Components

#### `LoadingSpinner`
Traditional spinner with optional text.

```tsx
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";

<LoadingSpinner text="Loading data..." />
```

#### `FullPageLoading`
Full-page loading overlay.

```tsx
import { FullPageLoading } from "@/components/loading/FullPageLoading";

<FullPageLoading />
```

## Design System

All skeleton components follow these design principles:

- **Color**: Uses `neutral-200` from the design system palette
- **Animation**: Pulse animation (`animate-pulse`)
- **Accessibility**: Includes proper ARIA attributes (`role="status"`, `aria-label`)
- **Performance**: Components are memoized with `React.memo`
- **Customization**: Support `className` prop for custom styling

## Best Practices

1. **Use skeletons for content areas**: Better than spinners for showing where content will appear
2. **Use spinners for actions**: Better for button loading states or quick operations
3. **Match skeleton to content**: The skeleton should approximate the actual content layout
4. **Keep it simple**: Don't over-complicate skeleton designs
5. **Test loading states**: Always verify loading states look good during development

## Examples

### Card Loading

```tsx
"use client";

import { useQueryListWallets } from "@/utils/generated/hooks";
import { CardSkeleton } from "@/components/loading/Skeleton";
import { WalletCard } from "./WalletCard";

export function WalletList() {
  const { data, isLoading } = useQueryListWallets();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {data?.wallets.map(wallet => (
        <WalletCard key={wallet.id} wallet={wallet} />
      ))}
    </div>
  );
}
```

### Table Loading

```tsx
"use client";

import { useQueryListTransactions } from "@/utils/generated/hooks";
import { TableSkeleton } from "@/components/loading/Skeleton";
import { TransactionTable } from "./TransactionTable";

export function TransactionList() {
  const { data, isLoading } = useQueryListTransactions();

  if (isLoading) {
    return <TableSkeleton rows={10} />;
  }

  return <TransactionTable transactions={data?.transactions || []} />;
}
```

### Mixed Loading States

```tsx
"use client";

import { CardSkeleton, TextSkeleton } from "@/components/loading/Skeleton";

export function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useSummary();
  const { data: wallets, isLoading: loadingWallets } = useWallets();

  return (
    <div className="space-y-6">
      {/* Summary section */}
      {loadingSummary ? (
        <TextSkeleton lines={2} className="max-w-md" />
      ) : (
        <div>
          <h1 className="text-2xl font-bold">{summary.title}</h1>
          <p className="text-neutral-600">{summary.description}</p>
        </div>
      )}

      {/* Wallets section */}
      {loadingWallets ? (
        <div className="grid gap-4 md:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <WalletGrid wallets={wallets} />
      )}
    </div>
  );
}
```
