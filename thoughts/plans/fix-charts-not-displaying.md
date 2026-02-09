# Fix Charts Not Displaying

## Problem Statement

All charts in the `src/wj-client/components/charts/` folder are not displaying anything on the dashboard. The chart components are well-implemented, but page-level components that use `ResponsiveContainer` from Recharts directly are missing required height props.

## Root Cause Analysis

### The Issue

The `ResponsiveContainer` component from Recharts requires explicit dimensions to render properly. When used without a `height` prop, it defaults to a height of 0, causing charts to be invisible.

### Affected Files

The following page-level components in `src/wj-client/app/dashboard/home/` are using `ResponsiveContainer` without the required `height` prop:

| File | Line | Component Type |
|------|------|----------------|
| [Balance.tsx](src/wj-client/app/dashboard/home/Balance.tsx#L108) | 108 | `ComposedChart` |
| [Dominance.tsx](src/wj-client/app/dashboard/home/Dominance.tsx#L120) | 120 | `PieChart` |
| [MonthlyDominance.tsx](src/wj-client/app/dashboard/home/MonthlyDominance.tsx#L133) | 133 | `AreaChart` |
| [AccountBalance.tsx](src/wj-client/app/dashboard/home/AccountBalance.tsx#L77) | 77 | `ComposedChart` |

### What's Working

The reusable chart components in `src/wj-client/components/charts/` are correctly implemented:

- [BarChart.tsx](src/wj-client/components/charts/BarChart.tsx#L174) - Has `height={100%}` on ResponsiveContainer
- [LineChart.tsx](src/wj-client/components/charts/LineChart.tsx#L178) - Has `height={100%}` on ResponsiveContainer
- [DonutChart.tsx](src/wj-client/components/charts/DonutChart.tsx#L123) - Has `height={100%}` on ResponsiveContainer
- [Sparkline.tsx](src/wj-client/components/charts/Sparkline.tsx#L79) - Has `height={100%}` on ResponsiveContainer

## Implementation Plan

### Step 1: Fix Balance.tsx

**File**: [src/wj-client/app/dashboard/home/Balance.tsx](src/wj-client/app/dashboard/home/Balance.tsx#L108)

**Current code** (line 108):
```tsx
<ResponsiveContainer>
```

**Change to**:
```tsx
<ResponsiveContainer width="100%" height="100%">
```

**Context**: The container div uses `aspect-video` which provides a height based on aspect ratio. The ResponsiveContainer needs to fill this container.

### Step 2: Fix Dominance.tsx

**File**: [src/wj-client/app/dashboard/home/Dominance.tsx](src/wj-client/app/dashboard/home/Dominance.tsx#L120)

**Current code** (line 120):
```tsx
<ResponsiveContainer>
```

**Change to**:
```tsx
<ResponsiveContainer width="100%" height="100%">
```

### Step 3: Fix MonthlyDominance.tsx

**File**: [src/wj-client/app/dashboard/home/MonthlyDominance.tsx](src/wj-client/app/dashboard/home/MonthlyDominance.tsx#L133)

**Current code** (line 133):
```tsx
<ResponsiveContainer>
```

**Change to**:
```tsx
<ResponsiveContainer width="100%" height="100%">
```

### Step 4: Fix AccountBalance.tsx

**File**: [src/wj-client/app/dashboard/home/AccountBalance.tsx](src/wj-client/app/dashboard/home/AccountBalance.tsx#L77)

**Current code** (line 77):
```tsx
<ResponsiveContainer>
```

**Change to**:
```tsx
<ResponsiveContainer width="100%" height="100%">
```

### Step 5: Verify Chart Display

After applying the fixes, verify that:

1. All charts render with proper dimensions
2. Charts are responsive and resize with the viewport
3. No console errors related to Recharts
4. Tooltips and interactions work correctly

## Technical Details

### Why `aspect-video` isn't enough

The container divs use `aspect-video` (16:9 aspect ratio) which should provide height. However, `ResponsiveContainer` needs explicit dimensions to calculate its internal chart size. Without the `height` prop, it defaults to 0.

### Why the reusable chart components work

The reusable components (BarChart, LineChart, etc.) use:
```tsx
<div style={{ height: `${height}px` }}>
  <ResponsiveContainer width="100%" height="100%">
```

This provides both an outer container with explicit height AND tells ResponsiveContainer to fill it completely.

### Best Practice for Recharts ResponsiveContainer

Always provide both `width` and `height` props:

```tsx
// ✅ Correct
<ResponsiveContainer width="100%" height="100%">

// ❌ Wrong - renders with 0 height
<ResponsiveContainer>

// ⚠️ Works but less flexible
<ResponsiveContainer width="100%" height={300}>
```

## Success Criteria

- [ ] All four chart components display properly
- [ ] Charts are responsive across different screen sizes
- [ ] No console errors related to chart rendering
- [ ] Tooltips and legends display correctly
- [ ] Year selector functionality works as expected

## Testing

1. Navigate to the dashboard home page
2. Verify each chart section (Balance, Dominance, Monthly Dominance, Account Balance)
3. Check responsive behavior by resizing the browser window
4. Test year selector dropdowns to ensure charts update with new data

## Related Files

- [src/wj-client/app/dashboard/home/Balance.tsx](src/wj-client/app/dashboard/home/Balance.tsx)
- [src/wj-client/app/dashboard/home/Dominance.tsx](src/wj-client/app/dashboard/home/Dominance.tsx)
- [src/wj-client/app/dashboard/home/MonthlyDominance.tsx](src/wj-client/app/dashboard/home/MonthlyDominance.tsx)
- [src/wj-client/app/dashboard/home/AccountBalance.tsx](src/wj-client/app/dashboard/home/AccountBalance.tsx)
- [src/wj-client/components/charts/BarChart.tsx](src/wj-client/components/charts/BarChart.tsx)
- [src/wj-client/components/charts/LineChart.tsx](src/wj-client/components/charts/LineChart.tsx)
- [src/wj-client/components/charts/DonutChart.tsx](src/wj-client/components/charts/DonutChart.tsx)
- [src/wj-client/components/charts/Sparkline.tsx](src/wj-client/components/charts/Sparkline.tsx)

## Dependencies

- `recharts` version 2.15.0 (already installed)

## Estimated Complexity

Low - Simple prop additions to 4 files, no logic changes required.

## Created

2026-02-07
