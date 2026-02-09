# Icon Migration Guide

## Overview

This guide explains how to migrate from the old icon system (public SVG files + inline SVGs) to the new centralized icon component system.

## Why Migrate?

The old system had several issues:
- ❌ Hardcoded colors prevented theming (income/expense icons)
- ❌ Inconsistent sizing across components
- ❌ Mixed approaches (Image component vs inline SVGs)
- ❌ No centralized icon registry
- ❌ Performance overhead from Image component for simple icons

The new system provides:
- ✅ Themeable icons using `currentColor`
- ✅ Consistent sizing with presets (xs, sm, md, lg, xl)
- ✅ Type-safe icon imports
- ✅ Proper accessibility support
- ✅ Memoized components for performance
- ✅ Zero external HTTP requests (SVGs embedded in components)

## Migration Examples

### Before: Using Image Component with Public SVG

```tsx
// ❌ Old way
import Image from "next/image";
import { ICON_PATHS } from "@/components/icons/legacy";

<Image
  src={ICON_PATHS.wallet}
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

### Before: Legacy Icon Wrapper

```tsx
// ❌ Old way
import { LegacyIcon } from "@/components/icons/legacy";

<LegacyIcon name="wallet" className="w-6 h-6" />
```

### After: Direct Icon Import

```tsx
// ✅ New way
import { WalletIcon } from "@/components/icons";

<WalletIcon size="lg" />
```

## Icon Reference

### Navigation Icons

| Old Path/Inline | New Component | Category |
|----------------|---------------|----------|
| `/home.svg` | `HomeIcon` | Navigation |
| `/dashboard.svg` | `HomeIcon` | Navigation (alias) |
| `/wallet.svg` | `WalletIcon` | Navigation |
| `/wallet-white.svg` | `WalletIcon` + `text-white` | Navigation |
| `/transaction.svg` | `TransactionIcon` | Navigation |
| `/portfolio.svg` | `PortfolioIcon` | Navigation |
| `/budget.svg` | `BudgetIcon` | Navigation |
| `/report.svg` | `ReportsIcon` | Navigation |

### Action Icons

| Old Path/Inline | New Component | Category |
|----------------|---------------|----------|
| `/resources/icons/plus.svg` | `PlusIcon` | UI |
| `/resources/icons/edit.svg` | `EditIcon` | Actions |
| `/resources/icons/editing.svg` | `EditIcon` | Actions (alias) |
| `/resources/icons/delete.svg` | `DeleteIcon` | Actions |
| `/resources/icons/remove.svg` | `DeleteIcon` | Actions (alias) |
| `/resources/icons/close.svg` | `XIcon` | UI |
| `/resources/icons/logout.svg` | `LogoutIcon` | Actions |

### Finance Icons

| Old Path/Inline | New Component | Notes |
|----------------|---------------|-------|
| `/resources/icons/income.svg` | `IncomeIcon` | Now themeable (was hardcoded green) |
| `/resources/icons/expense.svg` | `ExpenseIcon` | Now themeable (was hardcoded red) |
| `/resources/icons/savings.svg` | `SavingsIcon` | Finance |
| `/resources/icons/transfer.svg` | `TransferIcon` | Finance |
| `/resources/icons/percent.svg` | `PercentIcon` | Finance |
| `/resources/icons/category.svg` | `CategoryIcon` | Finance |

### UI Icons

| Old Path/Inline | New Component | Notes |
|----------------|---------------|-------|
| `/resources/icons/chevron-left.svg` | `ChevronLeftIcon` | UI |
| `/resources/icons/chevron-right.svg` | `ChevronRightIcon` | UI |
| `/resources/icons/down.svg` | `ChevronDownIcon` | UI |
| `/resources/icons/refresh.svg` | `RefreshIcon` | UI |
| `/resources/icons/hide.svg` | `EyeOffIcon` | UI |
| `/resources/icons/unhide.svg` | `EyeIcon` | UI |
| `/resources/icons/user.svg` | `UserIcon` | Actions |
| inline search | `SearchIcon` | UI (new) |

## Sizing System

Use size presets instead of arbitrary width/height classes:

| Preset | Tailwind | Dimensions | Use Case |
|-------|---------|------------|----------|
| `xs` | `w-3 h-3` | 12×12px | Compact, table cells, inline text |
| `sm` | `w-4 h-4` | 16×16px | Buttons with text, list items |
| `md` | `w-5 h-5` | 20×20px | Default size, form labels |
| `lg` | `w-6 h-6` | 24×24px | Standalone buttons, headers |
| `xl` | `w-8 h-8` | 32×32px | Hero sections, featured content |

### Size Migration Examples

```tsx
// Old way
<Icon name="wallet" className="w-4 h-4" />
<Icon name="wallet" className="w-6 h-6" />
<Icon name="wallet" className="w-8 h-8" />

// New way
<WalletIcon size="sm" />
<WalletIcon size="lg" />
<WalletIcon size="xl" />
```

## Theming

Finance icons (Income/Expense) use semantic colors:

```tsx
// Income - uses success color (green)
<IncomeIcon className="text-success-600" />

// Expense - uses danger color (red)
<ExpenseIcon className="text-danger-600" />

// Override with any color
<WalletIcon className="text-primary-600" />
<WalletIcon className="text-blue-500" />
```

### Color Migration Examples

```tsx
// Old way - hardcoded colors in SVG
// income.svg had fill="#10B981" hardcoded
// expense.svg had fill="#EF4444" hardcoded

// New way - themeable with Tailwind classes
<IncomeIcon className="text-success-600 dark:text-success-400" />
<ExpenseIcon className="text-danger-600 dark:text-danger-400" />
```

## Accessibility

All icons include proper ARIA attributes:

```tsx
// With label (for interactive icons)
<EditIcon ariaLabel="Edit transaction" />

// Decorative only (no screen reader announcement)
<CheckIcon decorative={true} />

// Default: uses icon name as label
<WalletIcon /> // aria-label="Wallets"
```

### Accessibility Migration Examples

```tsx
// Old way
<img src="/wallet.svg" alt="Wallet icon" />
<svg aria-hidden="true">...</svg>

// New way
<WalletIcon ariaLabel="Wallet" />
<WalletIcon decorative={true} />
```

## Import Patterns

### Individual Imports (Recommended)

```tsx
// Import only what you need
import { WalletIcon, TransactionIcon } from "@/components/icons";
```

### Barrel Import (Convenient)

```tsx
// Import all icons (convenient but may increase bundle size)
import * as Icons from "@/components/icons";

<Icons.WalletIcon size="lg" />
```

## Complete Migration Checklist

### Phase 1: Update Imports
- [ ] Replace `ICON_PATHS` imports with specific icon components
- [ ] Replace `LegacyIcon` usage with specific icon components
- [ ] Replace `Image` components loading SVGs with icon components

### Phase 2: Update Props
- [ ] Replace arbitrary `className="w-X h-Y"` with `size` prop
- [ ] Add `ariaLabel` to interactive icons
- [ ] Use `decorative={true}` for decorative icons

### Phase 3: Update Styling
- [ ] Remove hardcoded color overrides (use semantic colors)
- [ ] Apply dark mode variants where needed (`dark:text-XXX`)

### Phase 4: Testing
- [ ] Test in light mode
- [ ] Test in dark mode
- [ ] Test touch target sizes on mobile (minimum 44×44px for interactive icons)
- [ ] Verify screen reader announcements
- [ ] Check browser console for errors

### Phase 5: Cleanup
- [ ] Remove `legacy.tsx` import
- [ ] Delete public SVG files (after full migration)
- [ ] Update documentation

## Common Migration Patterns

### Button with Icon

```tsx
// Old way
<button className="flex items-center gap-2">
  <img src={ICON_PATHS.edit} className="w-4 h-4" alt="Edit" />
  <span>Edit</span>
</button>

// New way
<button className="flex items-center gap-2">
  <EditIcon size="sm" ariaLabel="Edit" />
  <span>Edit</span>
</button>
```

### Icon Button (Icon Only)

```tsx
// Old way
<button>
  <img src={ICON_PATHS.close} className="w-6 h-6" alt="Close" />
</button>

// New way
<button>
  <XIcon size="lg" ariaLabel="Close" />
</button>
```

### Table Cell Icon

```tsx
// Old way
<td>
  <img src={ICON_PATHS.income} className="w-3 h-3" alt="" />
</td>

// New way
<td>
  <IncomeIcon size="xs" decorative={true} />
</td>
```

### Navigation Menu

```tsx
// Old way
<nav>
  <Link href="/wallets">
    <img src={ICON_PATHS.wallet} className="w-5 h-5" alt="Wallets" />
    <span>Wallets</span>
  </Link>
</nav>

// New way
<nav>
  <Link href="/wallets" className="flex items-center gap-2">
    <WalletIcon size="md" ariaLabel="Wallets" />
    <span>Wallets</span>
  </Link>
</nav>
```

## Troubleshooting

### Icon Not Showing

1. Check import path: `from "@/components/icons"`
2. Verify component name is correct (PascalCase with "Icon" suffix)
3. Check browser console for errors

### Wrong Size

1. Use `size` prop instead of `className`
2. Check parent element doesn't override size
3. For custom sizes, use `width` and `height` props

### Color Not Working

1. Ensure icon uses `currentColor` (all new icons do)
2. Check Tailwind class is applied
3. Verify specificity (use `!` if needed: `!text-blue-500`)

### Accessibility Issues

1. Add `ariaLabel` to interactive icons
2. Use `decorative={true}` for visual-only icons
3. Test with screen reader (NVDA, JAWS, VoiceOver)

## Performance Notes

The new icon system is optimized for performance:

- **Memoized components**: Icons don't re-render unnecessarily
- **Zero HTTP requests**: SVGs embedded in components (no separate file loads)
- **Tree-shaking**: Unused icons are eliminated from bundle
- **Consistent rendering**: No layout shift from image loading

## Further Reading

- [Icon Component Documentation](../src/wj-client/components/icons/README.md)
- [Design System Reference](./DESIGN_SYSTEM_REFERENCE.md)
- [Accessibility Guidelines](./ACCESSIBILITY.md)
