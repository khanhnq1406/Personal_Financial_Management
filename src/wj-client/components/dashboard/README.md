# Dashboard Components

This directory contains specialized components for the dashboard UI, designed according to the UI/UX Optimization Plan.

## BalanceCard

A premium balance display card with gradient background, visibility toggle, change indicators, and trust signals.

### Features

- **Gradient Background**: Professional blue gradient (primary-600 to primary-700)
- **Balance Visibility Toggle**: Eye icon to hide/show sensitive balance information
- **Change Indicator**: Shows percentage change with up/down arrows (green for positive, red for negative)
- **Period Label**: Displays the time period for the change (e.g., "This Month", "This Week")
- **Last Updated Timestamp**: Shows when data was last refreshed using `date-fns`
- **Verified Badge**: Optional trust signal for verified data
- **Responsive Design**: Optimized for mobile and desktop
- **Accessibility**: WCAG compliant with proper ARIA labels and 44px minimum touch targets

### Props

```typescript
interface BalanceCardProps {
  balance: number;           // Required: Balance amount in smallest unit (e.g., VND or cents)
  currency?: string;         // Optional: ISO 4217 currency code (default: "VND")
  change?: {
    amount: number;          // Change amount in smallest unit
    percentage: number;      // Change percentage (e.g., 2.04 for +2.04%)
    period: string;          // Period label (e.g., "This Month", "This Week")
  };
  lastUpdated?: Date;        // Optional: Timestamp of last data update
  showVerified?: boolean;    // Optional: Show verified badge (default: true)
  className?: string;        // Optional: Additional CSS classes
}
```

### Usage Examples

#### Basic Usage

```tsx
import { BalanceCard } from "@/components/dashboard/BalanceCard";

export default function DashboardPage() {
  return (
    <BalanceCard
      balance={12500000}
      currency="VND"
    />
  );
}
```

#### With Change Indicator

```tsx
<BalanceCard
  balance={12500000}
  currency="VND"
  change={{
    amount: 250000,
    percentage: 2.04,
    period: "This Month"
  }}
  lastUpdated={new Date()}
  showVerified={true}
/>
```

#### Integration with API Data

```tsx
"use client";

import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { useQueryListWallets } from "@/utils/generated/hooks";

export default function DashboardHome() {
  const { data: walletsData, isLoading } = useQueryListWallets({
    pagination: { page: 1, pageSize: 100, orderBy: "", order: "" }
  });

  if (isLoading) return <div>Loading...</div>;

  const totalBalance = walletsData?.wallets?.reduce(
    (sum, wallet) => sum + (wallet.balance?.amount || 0),
    0
  ) || 0;

  return (
    <BalanceCard
      balance={totalBalance}
      currency="VND"
      change={{
        amount: 250000,
        percentage: 2.04,
        period: "This Month"
      }}
      lastUpdated={new Date()}
    />
  );
}
```

### Styling Notes

- **Gradient**: Uses `bg-gradient-to-br from-primary-600 to-primary-700`
- **Text Color**: White text for contrast against dark blue background
- **Shadow**: `shadow-card` for subtle elevation
- **Border Radius**: `rounded-lg` for modern appearance
- **Responsive Padding**: `p-4 sm:p-6` for mobile and desktop

### Accessibility

- **Touch Targets**: Eye toggle button is 44x44px minimum
- **ARIA Labels**: Proper labels for screen readers
- **Keyboard Navigation**: Fully keyboard accessible
- **Color Contrast**: WCAG AAA compliant text contrast
- **Focus States**: Visible focus indicators

### Related Components

- `BaseCard`: Base card wrapper used throughout the app
- `DataFreshnessIndicator`: Shows "Updated X ago" timestamp
- `VerifiedBadge`: Trust signal badge

### Design Inspiration

This component follows modern fintech design patterns seen in:
- Revolut: Clean balance display with change indicators
- Stripe Dashboard: Professional gradients and trust signals
- Wise: Clear typography and hierarchy

### Technical Details

- **Performance**: Memoized with `React.memo` to prevent unnecessary re-renders
- **State Management**: Uses local `useState` for visibility toggle
- **Date Formatting**: Uses `date-fns` for "time ago" formatting
- **Currency Formatting**: Uses centralized `formatCurrency` utility

### Migration from Old Design

If you're replacing an existing balance display:

**Before:**
```tsx
<div className="bg-white p-4">
  <span className="text-lg">{currencyFormatter.format(balance)}</span>
</div>
```

**After:**
```tsx
<BalanceCard
  balance={balance}
  currency="VND"
  change={{ amount: 250000, percentage: 2.04, period: "This Month" }}
  lastUpdated={new Date()}
/>
```

### Testing

To verify the component works correctly:

1. **Visibility Toggle**: Click the eye icon to hide/show balance
2. **Responsive**: Test on mobile (< 640px) and desktop
3. **Change Colors**: Verify green for positive, red for negative
4. **Date Formatting**: Check "Updated X ago" displays correctly
5. **Currency Support**: Test with VND, USD, and other currencies

### Future Enhancements

Potential improvements for future versions:

- [ ] Animation on balance change
- [ ] Sparkline chart showing balance trend
- [ ] Multiple currency support in single card
- [ ] Export balance data to CSV/PDF
- [ ] Custom gradient color schemes
