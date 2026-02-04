# Trust & Security Indicator Components

These components provide visual trust signals to build user confidence in financial data, as outlined in the UI/UX Optimization Plan (section 4.1).

## Components

### 1. ConnectionStatus

Shows a secure connection indicator with a lock icon.

**Features:**
- Automatically detects HTTPS vs HTTP
- Green success state for secure connections
- Red danger state for unsecure connections
- Small and unobtrusive design

**Usage:**
```tsx
import { ConnectionStatus } from "@/components/trust/ConnectionStatus";

// In your component
<ConnectionStatus />
```

**Where to use:**
- Dashboard header (already implemented)
- Settings page
- Login/authentication pages
- Anywhere security visibility is important

---

### 2. DataFreshnessIndicator

Shows when data was last updated with a clock icon and relative time.

**Features:**
- Displays relative time (e.g., "2 minutes ago", "1 hour ago")
- Auto-updates every minute
- Small, subtle design
- Uses neutral colors to avoid distraction

**Usage:**
```tsx
import { DataFreshnessIndicator } from "@/components/trust/DataFreshnessIndicator";

// In your component
const lastUpdated = new Date(); // Your data timestamp

<DataFreshnessIndicator lastUpdated={lastUpdated} />
```

**Props:**
- `lastUpdated` (Date, required): The timestamp when data was last updated
- `className` (string, optional): Additional CSS classes

**Where to use:**
- Portfolio summary cards (show price update time)
- Transaction lists (show sync time)
- Dashboard cards (show data freshness)
- Balance displays (show last refresh)

**Example with portfolio:**
```tsx
<div className="flex items-center justify-between">
  <h3>Portfolio Summary</h3>
  <DataFreshnessIndicator lastUpdated={portfolioData.lastUpdated} />
</div>
```

---

### 3. VerifiedBadge

Shows a verified checkmark badge for data from trusted sources.

**Features:**
- Checkmark icon in primary blue
- Customizable text
- Small, badge-like design
- Use for verified/official data sources

**Usage:**
```tsx
import { VerifiedBadge } from "@/components/trust/VerifiedBadge";

// Default usage
<VerifiedBadge />

// Custom text
<VerifiedBadge text="Official Data" />
<VerifiedBadge text="Yahoo Finance" />
```

**Props:**
- `text` (string, optional): Badge text (default: "Verified Data")
- `className` (string, optional): Additional CSS classes

**Where to use:**
- Investment data from Yahoo Finance API
- Balance displays from bank connections
- Official exchange rates
- Verified market prices

**Example with investment card:**
```tsx
<div className="flex items-center gap-2">
  <span className="text-sm font-medium">Market Price</span>
  <VerifiedBadge text="Yahoo Finance" />
</div>
```

---

## Design System

All components follow the application's design system:

**Colors:**
- Success: `success-50`, `success-200`, `success-600`, `success-700` (green)
- Primary: `primary-50`, `primary-200`, `primary-600`, `primary-700` (blue)
- Danger: `danger-50`, `danger-200`, `danger-600`, `danger-700` (red)
- Neutral: `neutral-500` (gray for timestamps)

**Sizing:**
- Icons: `w-3.5 h-3.5` or `w-4 h-4`
- Text: `text-xs` (12px)
- Padding: `px-2 py-1` or `px-3 py-1.5`
- Border radius: `rounded` or `rounded-lg`

**Accessibility:**
- All icons have `aria-hidden="true"` (decorative)
- Color is not the only indicator (text labels included)
- Proper contrast ratios (WCAG AA compliant)

---

## Real-World Usage Examples

### Example 1: Portfolio Card with Trust Indicators

```tsx
import { VerifiedBadge } from "@/components/trust/VerifiedBadge";
import { DataFreshnessIndicator } from "@/components/trust/DataFreshnessIndicator";

export function PortfolioCard({ data }) {
  return (
    <div className="bg-white rounded-lg shadow-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Total Portfolio Value</h3>
          <VerifiedBadge text="Real-time" />
        </div>
        <DataFreshnessIndicator lastUpdated={data.lastUpdated} />
      </div>

      <div className="text-3xl font-bold">
        {formatCurrency(data.totalValue)}
      </div>
    </div>
  );
}
```

### Example 2: Investment Detail Modal

```tsx
import { VerifiedBadge } from "@/components/trust/VerifiedBadge";
import { DataFreshnessIndicator } from "@/components/trust/DataFreshnessIndicator";

export function InvestmentDetailModal({ investment }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{investment.symbol}</h2>
        <div className="flex items-center gap-3">
          <VerifiedBadge text="Yahoo Finance" />
          <DataFreshnessIndicator lastUpdated={investment.priceUpdatedAt} />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between">
          <span className="text-neutral-600">Current Price</span>
          <span className="font-semibold">{investment.currentPrice}</span>
        </div>
        {/* More details */}
      </div>
    </div>
  );
}
```

### Example 3: Balance Card with Security

```tsx
import { ConnectionStatus } from "@/components/trust/ConnectionStatus";
import { DataFreshnessIndicator } from "@/components/trust/DataFreshnessIndicator";

export function BalanceCard({ balance, lastSynced }) {
  return (
    <div className="bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-lg p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-primary-100">Total Balance</span>
        <ConnectionStatus />
      </div>

      <div className="text-4xl font-bold mb-4">
        {formatCurrency(balance)}
      </div>

      <DataFreshnessIndicator
        lastUpdated={lastSynced}
        className="text-primary-100"
      />
    </div>
  );
}
```

---

## Implementation Status

- [x] ConnectionStatus component created
- [x] DataFreshnessIndicator component created
- [x] VerifiedBadge component created
- [x] ConnectionStatus added to dashboard layout
- [ ] Add to portfolio page (recommended)
- [ ] Add to investment detail modal (recommended)
- [ ] Add to balance cards (recommended)

---

## Future Enhancements

1. **Auto-stale detection**: Automatically show warning if data is too old
2. **Sync indicator**: Show active syncing animation
3. **Error states**: Show disconnected/error states
4. **Tooltip support**: Add hover tooltips with more details
5. **Animation**: Subtle fade-in animation on mount
