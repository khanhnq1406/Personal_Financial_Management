# BaseCard Component - Enhancement Documentation

> **Component**: `BaseCard.tsx`
> **Location**: `/src/wj-client/components/BaseCard.tsx`
> **Status**: Enhanced for Phase 1 UI/UX Optimization
> **Last Updated**: 2026-02-04

---

## Overview

The `BaseCard` component is a flexible, responsive card container optimized for mobile-first design. It provides configurable padding, shadows, hover effects, and collapsible content support.

---

## Features

### Core Features
- Configurable padding variants (none, sm, md, lg)
- Shadow variants (none, sm, md, lg)
- Hover effects with shadow elevation
- Click handling support
- Mobile-optimized spacing

### New Enhancements (Phase 1)
- Collapsible content support
- Mobile-only collapsible mode
- Custom collapsed headers
- Enhanced responsive breakpoints (mobile → sm → lg)
- WCAG-compliant touch targets
- Accessible toggle controls
- Smooth animations and transitions

---

## Props API

```typescript
interface BaseCardProps {
  // Content
  children: React.ReactNode;
  className?: string;

  // Spacing & Appearance
  padding?: "none" | "sm" | "md" | "lg";
  shadow?: "sm" | "md" | "lg" | "none";
  hover?: boolean;

  // Interaction
  onClick?: () => void;

  // Mobile Optimization
  mobileOptimized?: boolean;
  noMobileMargin?: boolean;

  // Collapsible Content
  collapsible?: boolean;
  collapsibleOnMobile?: boolean;
  defaultCollapsed?: boolean;
  collapsedHeader?: React.ReactNode;
  collapseAriaLabel?: string;
}
```

---

## Prop Details

### `padding`
Controls internal padding with responsive behavior.

| Value | Mobile (<640px) | Tablet (640px+) | Desktop (1024px+) |
|-------|-----------------|-----------------|-------------------|
| `none` | - | - | - |
| `sm` | p-2 (8px) / p-3 (12px) | p-3 (12px) / p-4 (16px) | p-4 (16px) |
| `md` | p-2 (8px) / p-3 (12px) | p-3 (12px) / p-5 (20px) | p-5 (20px) / p-6 (24px) |
| `lg` | p-3 (12px) / p-4 (16px) | p-4 (16px) / p-5 (20px) | p-6 (24px) / p-8 (32px) |

**Note**: First value = `mobileOptimized={true}`, second value = default.

**Default**: `"md"`

### `shadow`
Controls elevation shadow.

| Value | Description |
|-------|-------------|
| `none` | No shadow |
| `sm` | Subtle shadow |
| `md` | Standard card shadow (default) |
| `lg` | Prominent shadow |

**Default**: `"md"`

### `hover`
Enables hover effect with shadow elevation.

- **Type**: `boolean`
- **Effect**: `shadow-card-hover` on hover
- **Cursor**: `pointer`
- **Transition**: `200ms` smooth

**Default**: `false`

### `onClick`
Optional click handler for interactive cards.

When provided:
- Cursor becomes `pointer`
- Active state: `shadow-card-active`
- Compatible with `hover` prop

### `mobileOptimized`
Enables mobile-first optimizations.

**Effects**:
- Reduced padding on mobile (see `padding` table above)
- Smaller border radius: `rounded-sm` (mobile) → `rounded-md` (sm) → `rounded-lg` (lg)
- Better touch target spacing

**Default**: `false`

### `noMobileMargin`
Removes bottom margin on mobile for tighter stacking.

**Default**: `false` (shows `mb-2 sm:mb-3 lg:mb-4`)

### `collapsible`
Enables collapsible content with expand/collapse toggle.

**Features**:
- Animated chevron icon (rotates on toggle)
- Touch-friendly toggle button (44x44px min)
- Accessible with ARIA labels
- Smooth 200ms transitions

**Default**: `false`

### `collapsibleOnMobile`
Enables collapsible behavior only on mobile devices.

**Behavior**:
- Mobile (<768px): Collapsible with chevron
- Desktop (≥768px): Always expanded, no chevron shown
- Content uses `md:block` class on desktop

**Default**: `false`

### `defaultCollapsed`
Initial collapsed state when `collapsible` or `collapsibleOnMobile` is true.

- `true`: Content starts collapsed
- `false`: Content starts expanded (default)

**Default**: `false`

### `collapsedHeader`
Custom header element to display when collapsed.

**Usage**:
- If provided, replaces `children` in the header area
- Full `children` rendered in content area when expanded
- Useful for summary/preview text

**Default**: `undefined` (uses `children` as header)

### `collapseAriaLabel`
Accessibility label for the collapse toggle button.

**Default**: `"Toggle content"`

---

## Responsive Breakpoints

The component uses Tailwind's standard breakpoints:

| Breakpoint | Screen Width | Usage in BaseCard |
|------------|--------------|-------------------|
| `sm` | ≥640px (40em) | First responsive tier |
| `md` | ≥768px (48em) | Mobile collapsible hidden threshold |
| `lg` | ≥1024px (64em) | Full desktop spacing |

---

## Accessibility Features

### Touch Targets
- Toggle button: `min-h-[44px] min-w-[44px]` (WCAG minimum)
- Header area: `min-h-[44px]` for comfortable touch

### Keyboard Navigation
- Toggle button: Tab-accessible with visible focus ring
- Focus styles: `focus-visible:ring-2 ring-primary-500 ring-offset-2`

### Screen Reader Support
- `aria-label` on toggle button (customizable)
- `aria-expanded` state reflects collapse status
- Semantic HTML structure

### Color Contrast
- Toggle button text: `text-neutral-500 hover:text-neutral-700 active:text-neutral-900`
- Meets WCAG AA standards (4.5:1 minimum)

---

## Usage Examples

### Basic Card

```tsx
<BaseCard>
  <p>Simple card with default padding and shadow</p>
</BaseCard>
```

### Mobile-Optimized Card

```tsx
<BaseCard mobileOptimized padding="md">
  <h3>Mobile Optimized</h3>
  <p>Tighter spacing on mobile, comfortable on desktop</p>
</BaseCard>
```

### Interactive Card

```tsx
<BaseCard
  hover
  onClick={handleClick}
  padding="lg"
>
  <div className="flex items-center justify-between">
    <span>Click me!</span>
    <span>→</span>
  </div>
</BaseCard>
```

### Collapsible Card (Always)

```tsx
<BaseCard
  collapsible
  defaultCollapsed={false}
  collapseAriaLabel="Toggle account details"
>
  <h3>Account Balance</h3>
  <p className="text-2xl font-bold">₫10,234,567</p>
  <div className="mt-4">
    <p>Income: +₫5,000,000</p>
    <p>Expenses: -₫2,500,000</p>
  </div>
</BaseCard>
```

### Mobile-Only Collapsible

```tsx
<BaseCard
  collapsibleOnMobile
  defaultCollapsed={true}
  collapsedHeader={
    <div>
      <h3>Transaction History</h3>
      <p className="text-sm text-neutral-500">Tap to expand</p>
    </div>
  }
>
  <TransactionList />
</BaseCard>
```

### Dashboard Layout

```tsx
<div className="space-y-3 sm:space-y-4">
  {/* Summary - Always visible */}
  <BaseCard padding="lg">
    <h2>Financial Overview</h2>
    <BalanceSummary />
  </BaseCard>

  {/* Details - Collapsible on mobile */}
  <BaseCard
    collapsibleOnMobile
    defaultCollapsed={true}
    collapsedHeader={<h3>Recent Transactions</h3>}
  >
    <TransactionList />
  </BaseCard>
</div>
```

---

## Design System Integration

### Colors Used
- Background: `bg-white`
- Text: `text-neutral-500`, `text-neutral-700`, `text-neutral-900`
- Focus ring: `ring-primary-500`

### Shadows Used
- Default: `shadow-card`
- Hover: `shadow-card-hover`
- Active: `shadow-card-active`

### Border Radius
- Default: `rounded-lg` (1rem / 16px)
- Mobile optimized: `rounded-sm` (4px) → `rounded-md` (8px) → `rounded-lg` (16px)

### Transitions
- Shadow: `duration-200` (200ms)
- Transform (chevron): `duration-200` (200ms)
- Colors: `duration-150` (150ms)

---

## Migration Guide

### From Previous Version

The enhanced `BaseCard` is **100% backward compatible**. Existing usage will continue to work without changes.

#### Before (Still Works)
```tsx
<BaseCard>
  <p>Content</p>
</BaseCard>
```

#### After (New Features)
```tsx
<BaseCard
  mobileOptimized
  collapsibleOnMobile
  defaultCollapsed={true}
>
  <p>Content</p>
</BaseCard>
```

---

## Performance Considerations

### Memoization
- Component is wrapped in `React.memo` to prevent unnecessary re-renders
- `handleToggle` callback is memoized with `useCallback`

### Conditional Rendering
- Collapsible content uses conditional rendering to minimize DOM
- SVG chevron is inlined (no extra HTTP request)

### Bundle Size
- Zero additional dependencies
- Uses existing `cn` utility from `@/lib/utils/cn`

---

## Testing Checklist

### Visual Testing
- [ ] Verify padding variants at all breakpoints
- [ ] Check shadow variants on different backgrounds
- [ ] Test hover effects on interactive cards
- [ ] Validate mobile-optimized spacing

### Functional Testing
- [ ] Collapse/expand toggle works correctly
- [ ] Mobile-only collapsible hides chevron on desktop
- [ ] `onClick` handlers fire without conflicts
- [ ] `defaultCollapsed` state is respected

### Accessibility Testing
- [ ] Toggle button is keyboard accessible (Tab)
- [ ] Focus ring is visible on toggle button
- [ ] Screen reader announces aria-label and aria-expanded
- [ ] Touch targets meet 44x44px minimum

### Responsive Testing
- [ ] Mobile (<640px): Tight spacing, rounded-sm
- [ ] Tablet (640px-1023px): Medium spacing, rounded-md
- [ ] Desktop (≥1024px): Full spacing, rounded-lg
- [ ] Mobile-only collapsible: Hidden on desktop

---

## Known Limitations

1. **Animation**: Collapse transition uses `display: none` (no height animation)
   - **Workaround**: Content appears/disappears instantly
   - **Future**: Could add height animation library

2. **Nested Collapsible**: Not recommended to nest collapsible cards
   - **Reason**: Confusing UX with multiple chevrons
   - **Alternative**: Use nested non-collapsible cards inside a collapsible parent

3. **Custom Chevron**: Currently no prop to replace chevron icon
   - **Workaround**: Use className to hide default, add custom icon in `collapsedHeader`
   - **Future**: Could add `collapseIcon` prop

---

## Related Components

- **Button**: Primary/secondary buttons with similar mobile optimization
- **BaseModal**: Modal component with responsive design
- **TanStackTable**: Table component that pairs well with BaseCard
- **MobileTable**: Mobile-optimized table for small screens

---

## Future Enhancements

### Phase 2 Considerations
- [ ] Add `variant` prop for color themes (success, danger, warning)
- [ ] Support `fullHeight` for sticky/height-constrained layouts
- [ ] Add `loading` prop with skeleton content
- [ ] Implement smooth height animation for collapse

### Phase 3 Considerations
- [ ] Dark mode support with `dark:` variants
- [ ] Swipe gesture support for mobile collapse
- [ ] Haptic feedback on mobile toggle (Vibration API)

---

## Support & Maintenance

### Component Owner
- **Created**: 2026-02-04
- **Last Modified**: 2026-02-04
- **Status**: Active (Phase 1 Complete)

### Documentation
- See `BaseCard.usage.examples.tsx` for 13+ usage examples
- See `DESIGN_SYSTEM_REFERENCE.md` for design tokens
- See `UI_UX_OPTIMIZATION_PLAN.md` for roadmap

---

## Changelog

### Version 2.0.0 (2026-02-04)
**Enhanced for Phase 1 UI/UX Optimization**

#### Added
- `collapsible` prop for always-collapsible content
- `collapsibleOnMobile` prop for mobile-only collapsible
- `defaultCollapsed` prop for initial collapse state
- `collapsedHeader` prop for custom collapsed display
- `collapseAriaLabel` prop for accessibility
- Chevron icon with rotation animation
- Enhanced responsive breakpoints (sm, md, lg)
- WCAG-compliant touch targets (44x44px minimum)
- `use client` directive for React hooks support

#### Changed
- Improved mobile padding scale with 3-tier responsive variants
- Enhanced `mobileOptimized` prop with better border radius scaling
- Updated bottom margin to `mb-2 sm:mb-3 lg:mb-4` for better stacking

#### Fixed
- N/A (initial release)

#### Breaking Changes
- None (100% backward compatible)

### Version 1.0.0 (Previous)
- Initial implementation with basic padding/shadow variants
- Mobile-optimized mode support
- Hover and click interaction support

---

**End of Documentation**
