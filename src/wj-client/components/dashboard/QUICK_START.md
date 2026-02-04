# BalanceCard Quick Start Guide

## TL;DR - Get Started in 30 Seconds

### 1. Import
```tsx
import { BalanceCard } from "@/components/dashboard/BalanceCard";
```

### 2. Use
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
/>
```

### 3. Done! 🎉

---

## Common Use Cases

### Basic Balance (No Change)
```tsx
<BalanceCard balance={12500000} currency="VND" />
```

### With Positive Change
```tsx
<BalanceCard
  balance={12500000}
  currency="VND"
  change={{ amount: 250000, percentage: 2.04, period: "This Month" }}
  lastUpdated={new Date()}
/>
```

### USD Currency
```tsx
<BalanceCard
  balance={524500}  // $5,245.00 in cents
  currency="USD"
  change={{ amount: 10500, percentage: 2.04, period: "This Week" }}
  lastUpdated={new Date()}
/>
```

### Without Verified Badge
```tsx
<BalanceCard
  balance={12500000}
  currency="VND"
  showVerified={false}
/>
```

---

## Integration with API

```tsx
"use client";

import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { useQueryListWallets } from "@/utils/generated/hooks";

export default function Dashboard() {
  const { data } = useQueryListWallets({
    pagination: { page: 1, pageSize: 100, orderBy: "", order: "" }
  });

  const total = data?.wallets?.reduce(
    (sum, w) => sum + (w.balance?.amount || 0),
    0
  ) || 0;

  return (
    <BalanceCard
      balance={total}
      currency="VND"
      change={{ amount: 250000, percentage: 2.04, period: "This Month" }}
      lastUpdated={new Date()}
    />
  );
}
```

---

## Props Cheat Sheet

| Prop | Type | Required | Default | Example |
|------|------|----------|---------|---------|
| `balance` | `number` | ✅ Yes | - | `12500000` |
| `currency` | `string` | ⚠️ Recommended | `"VND"` | `"USD"`, `"EUR"` |
| `change` | `object` | ❌ No | - | See below |
| `lastUpdated` | `Date` | ❌ No | - | `new Date()` |
| `showVerified` | `boolean` | ❌ No | `true` | `false` |
| `className` | `string` | ❌ No | - | `"mt-4"` |

### Change Object Structure
```tsx
change: {
  amount: number;      // Change in smallest unit (e.g., VND or cents)
  percentage: number;  // e.g., 2.04 for +2.04%
  period: string;      // e.g., "This Month", "Last 7 Days"
}
```

---

## Styling & Layout

### Full Width
```tsx
<BalanceCard balance={12500000} currency="VND" />
```

### In Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <BalanceCard balance={12500000} currency="VND" />
  <BalanceCard balance={524500} currency="USD" />
</div>
```

### Custom Spacing
```tsx
<BalanceCard
  balance={12500000}
  currency="VND"
  className="mt-6 mb-4"
/>
```

---

## Features at a Glance

✅ Gradient background (blue)
✅ Hide/show balance (eye icon)
✅ Change indicator (green/red with arrows)
✅ Last updated timestamp
✅ Verified badge
✅ Multi-currency support
✅ Fully responsive
✅ WCAG accessible

---

## Testing Your Component

### 1. View Demo Page
```bash
# Create demo route
mkdir -p app/demo/balance-card
echo 'export { default } from "@/components/dashboard/BalanceCard.demo";' > app/demo/balance-card/page.tsx

# Visit: http://localhost:3000/demo/balance-card
```

### 2. Quick Checks
- [ ] Balance displays correctly
- [ ] Currency symbol appears
- [ ] Eye icon toggles visibility
- [ ] Change indicator shows correct color
- [ ] Last updated shows "X ago"
- [ ] Responsive on mobile/desktop

---

## Troubleshooting

### Balance shows wrong decimals
```tsx
// VND has 0 decimals - store as-is
balance={12500000}  // ✅ Shows: ₫12,500,000

// USD has 2 decimals - store in cents
balance={524500}    // ✅ Shows: $5,245.00
```

### Currency not formatting
```tsx
// Make sure currency prop is set
<BalanceCard balance={12500000} currency="VND" />  // ✅ Correct

// Default is VND if omitted
<BalanceCard balance={12500000} />  // ⚠️ Uses VND
```

### Last updated not showing
```tsx
// Pass a Date object
<BalanceCard
  balance={12500000}
  currency="VND"
  lastUpdated={new Date()}  // ✅ Required for timestamp
/>
```

### Change indicator not appearing
```tsx
// All three properties required
change={{
  amount: 250000,       // ✅ Must provide
  percentage: 2.04,     // ✅ Must provide
  period: "This Month"  // ✅ Must provide
}}
```

---

## Pro Tips

💡 **Use with wallet totals**: Perfect for dashboard overview
💡 **Show period-specific changes**: "This Month", "This Week", etc.
💡 **Hide sensitive data**: Users can toggle visibility
💡 **Update regularly**: Refresh lastUpdated on data change
💡 **Multi-currency support**: Great for international users

---

## Need More Help?

📖 [Full Documentation](./README.md)
🎨 [Visual Guide](./VISUAL_GUIDE.md)
💻 [Code Examples](./BalanceCard.example.tsx)
🎭 [Demo Page](./BalanceCard.demo.tsx)

---

**That's it! Start building awesome dashboards! 🚀**
