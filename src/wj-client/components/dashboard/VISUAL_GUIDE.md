# BalanceCard Visual Guide

## Component Preview

```
┌──────────────────────────────────────────────────────────────┐
│  Total Balance              [Verified]         👁           │
│                                                              │
│  ₫12,500,000                                                 │
│                                                              │
│  [↑ +2.04%]  This Month                                     │
│                                                              │
│  ────────────────────────────────────────────────────────── │
│  🕐 Updated 5 minutes ago                                    │
└──────────────────────────────────────────────────────────────┘
```

## Visual Elements

### 1. Header Section
```
Total Balance [Verified Badge]                    [Eye Icon]
────────────────────────────────────────────────────────────
- Text: "Total Balance" in primary-100 (light blue)
- Verified badge: White text on transparent background with border
- Eye icon: Toggle button (44x44px touch target)
```

### 2. Balance Display
```
₫12,500,000
────────────
- Font size: 3xl (30px) on mobile, 4xl (36px) on desktop
- Font weight: Bold (700)
- Color: White
- Can be hidden with blur effect
```

### 3. Change Indicator (Optional)
```
[↑ +2.04%]  This Month
──────────────────────
Positive change:
- Background: Green with 20% opacity (success-500/20)
- Text: Light green (success-100)
- Arrow: Up arrow icon

Negative change:
- Background: Red with 20% opacity (danger-500/20)
- Text: Light red (danger-100)
- Arrow: Down arrow icon
```

### 4. Footer Section (Optional)
```
────────────────────────────────
🕐 Updated 5 minutes ago
────────────────────────────────
- Border: White with 10% opacity
- Text: White with 70% opacity
- Shows relative time (e.g., "5 minutes ago", "1 hour ago")
```

## Color Scheme

### Gradient Background
- Start: `primary-600` (#2563EB) - Deep blue
- End: `primary-700` (#1D4ED8) - Darker blue
- Direction: Bottom-right diagonal (`bg-gradient-to-br`)

### Text Colors
- Primary text: White
- Secondary text: `primary-100` (light blue)
- Footer text: White with 70% opacity

### Change Indicators
- Positive: Green background (`success-500/20`), light green text (`success-100`)
- Negative: Red background (`danger-500/20`), light red text (`danger-100`)

## Responsive Behavior

### Mobile (< 640px)
```
┌────────────────────────┐
│ Total Balance [✓]  👁  │
│                        │
│ ₫12,500,000            │
│                        │
│ [↑ +2.04%]             │
│ This Month             │
│                        │
│ ───────────────────    │
│ Updated 5 min ago      │
└────────────────────────┘
```
- Padding: 16px (p-4)
- Font size: 30px (text-3xl)
- Change indicator may wrap

### Desktop (≥ 640px)
```
┌─────────────────────────────────────────────────────┐
│ Total Balance [Verified]                     👁     │
│                                                      │
│ ₫12,500,000                                          │
│                                                      │
│ [↑ +2.04%]  This Month                              │
│                                                      │
│ ──────────────────────────────────────────────────  │
│ 🕐 Updated 5 minutes ago                            │
└─────────────────────────────────────────────────────┘
```
- Padding: 24px (p-6)
- Font size: 36px (text-4xl)
- All elements on single lines

## Interactive States

### 1. Eye Icon Hover
```css
Default: transparent background
Hover: white background with 10% opacity (hover:bg-white/10)
Active: pressed appearance
```

### 2. Balance Hidden State
```
₫12,500,000  →  ████████████
────────────────────────────
- Applies blur-md filter
- Makes text unselectable (select-none)
- Eye icon changes to "eye-off" icon
```

### 3. Focus States
```css
- Visible focus ring on eye toggle button
- Keyboard accessible
- Tab navigation support
```

## Spacing & Layout

### Internal Spacing
```
Padding: 16px (mobile) / 24px (desktop)
Gap between elements:
- Header to balance: 8px (mb-2)
- Balance to change: 16px (mb-4)
- Footer border: 16px top padding (pt-4)
```

### Touch Targets
```
Eye toggle button: 44x44px minimum
- Ensures WCAG compliance
- Easy to tap on mobile devices
```

## Animation & Transitions

### Balance Visibility Toggle
```css
transition: all 200ms ease
- Smooth blur effect when hiding
- Icon rotation when state changes
```

### Hover Effects
```css
Eye button hover:
- Background: white/10
- Transition: colors 200ms
```

## Accessibility Features

### ARIA Labels
- Eye button: "Show balance" / "Hide balance"
- Conveys current state to screen readers

### Keyboard Navigation
- Tab: Focus on eye toggle button
- Enter/Space: Toggle balance visibility
- Esc: (if needed in modal context)

### Screen Reader Experience
```
"Total Balance"
"Verified" (if badge shown)
"12,500,000 Vietnamese Dong" (formatted currency)
"Positive change: 2.04 percent"
"This Month"
"Updated 5 minutes ago"
"Button: Show balance" / "Button: Hide balance"
```

## Usage in Layouts

### Single Column (Mobile)
```
┌─────────────────┐
│  BalanceCard    │
│                 │
└─────────────────┘
┌─────────────────┐
│  Other Card     │
└─────────────────┘
```

### Grid Layout (Desktop)
```
┌─────────────────┐  ┌─────────────────┐
│  BalanceCard    │  │  Other Card     │
└─────────────────┘  └─────────────────┘
```

### Dashboard Hero Section
```
┌────────────────────────────────────────┐
│         BalanceCard (Full Width)       │
└────────────────────────────────────────┘
┌──────────┐ ┌──────────┐ ┌──────────┐
│  Card 1  │ │  Card 2  │ │  Card 3  │
└──────────┘ └──────────┘ └──────────┘
```

## Real-World Examples

### Example 1: Total Portfolio Balance
```tsx
<BalanceCard
  balance={45250000}      // ₫45,250,000
  currency="VND"
  change={{
    amount: 1250000,      // +₫1,250,000
    percentage: 2.84,     // +2.84%
    period: "This Month"
  }}
  lastUpdated={new Date()}
  showVerified={true}
/>
```

### Example 2: Wallet Balance (No Change Data)
```tsx
<BalanceCard
  balance={12500000}
  currency="VND"
/>
```

### Example 3: USD Investment Account
```tsx
<BalanceCard
  balance={524500}        // $5,245.00 (in cents)
  currency="USD"
  change={{
    amount: 10500,        // +$105.00
    percentage: 2.04,
    period: "Last 7 Days"
  }}
  lastUpdated={new Date()}
/>
```

## Design Inspiration

This component follows modern fintech design patterns from:

1. **Revolut**: Clean balance display with change indicators
2. **Stripe Dashboard**: Professional gradients and trust signals
3. **Wise**: Clear typography and visual hierarchy
4. **PayPal**: Security indicators and data confidence

## Best Practices

### DO ✅
- Use for primary balance displays
- Show verified badge for trusted data sources
- Include change indicators when available
- Update lastUpdated timestamp regularly
- Use appropriate currency codes

### DON'T ❌
- Don't use for secondary metrics (use regular cards)
- Don't omit currency parameter (defaults to VND)
- Don't show verified badge without real verification
- Don't make fake change data (show nothing instead)
- Don't use for non-financial data

## Testing Checklist

- [ ] Balance formats correctly for VND (no decimals)
- [ ] Balance formats correctly for USD (2 decimals)
- [ ] Eye icon toggles balance visibility
- [ ] Positive change shows green with up arrow
- [ ] Negative change shows red with down arrow
- [ ] Last updated timestamp updates correctly
- [ ] Verified badge appears when enabled
- [ ] Responsive on mobile (< 640px)
- [ ] Responsive on tablet (640px - 1024px)
- [ ] Responsive on desktop (> 1024px)
- [ ] Touch target is 44x44px minimum
- [ ] Keyboard navigation works
- [ ] Screen reader announces content correctly
- [ ] Hover effects work smoothly
- [ ] No layout shift when toggling visibility
