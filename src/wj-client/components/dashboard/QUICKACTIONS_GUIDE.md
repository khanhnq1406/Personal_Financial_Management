# QuickActions Component Documentation

## Overview

The `QuickActions` component is a mobile-optimized horizontal scrolling action bar that provides quick access to common dashboard operations. It is designed specifically for mobile devices (< 640px) and is automatically hidden on desktop where actions are available in the sidebar.

## Features

- **Mobile-First Design**: Only visible on screens < 640px (`flex sm:hidden`)
- **Touch-Friendly**: Minimum 44px touch targets for all buttons
- **Horizontal Scrolling**: Smooth horizontal scroll with hidden scrollbar
- **Icon + Label Layout**: Clear visual hierarchy with icon and text
- **Accessibility**: Full ARIA label support and keyboard navigation
- **Active States**: Visual feedback on touch/press
- **Flexible**: Customizable actions per page
- **Type-Safe**: Full TypeScript support

## Installation

The component is located at:
```
src/wj-client/components/dashboard/QuickActions.tsx
```

Import it like this:
```typescript
import {
  QuickActions,
  homeQuickActions,
  portfolioQuickActions,
  transactionQuickActions,
  walletsQuickActions,
  type ActionItem,
} from "@/components/dashboard/QuickActions";
```

## Basic Usage

### 1. Home Page

```tsx
"use client";

import { useState } from "react";
import { QuickActions, homeQuickActions } from "@/components/dashboard/QuickActions";

export default function HomePage() {
  const [modalType, setModalType] = useState<string | null>(null);

  const handleOpenModal = (type: string) => {
    setModalType(type);
  };

  return (
    <div>
      <QuickActions actions={homeQuickActions(handleOpenModal)} />
      {/* Rest of your page */}
    </div>
  );
}
```

### 2. Portfolio Page (with Refresh)

```tsx
import { useState } from "react";
import { QuickActions, portfolioQuickActions } from "@/components/dashboard/QuickActions";

export default function PortfolioPage() {
  const [modalType, setModalType] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleOpenModal = (type: string) => {
    setModalType(type);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshMarketPrices();
    setIsRefreshing(false);
  };

  return (
    <div>
      <QuickActions
        actions={portfolioQuickActions(handleOpenModal, handleRefresh)}
      />
      {/* Rest of your page */}
    </div>
  );
}
```

### 3. Custom Actions

```tsx
import { QuickActions, type ActionItem } from "@/components/dashboard/QuickActions";

const customActions: ActionItem[] = [
  {
    id: "export",
    label: "Export",
    icon: <YourIconComponent />,
    onClick: handleExport,
    ariaLabel: "Export data as CSV",
  },
  {
    id: "filter",
    label: "Filter",
    icon: <FilterIcon />,
    onClick: handleFilter,
    ariaLabel: "Filter transactions",
  },
];

<QuickActions actions={customActions} />
```

## Props Interface

### `QuickActionsProps`

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `actions` | `ActionItem[]` | Yes | - | Array of action items to display |
| `className` | `string` | No | - | Additional CSS classes to apply |
| `iconOnly` | `boolean` | No | `false` | Show icons only (hide labels) |

### `ActionItem`

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | `string` | Yes | Unique identifier for the action |
| `label` | `string` | Yes | Text label displayed below the icon |
| `icon` | `ReactNode` | Yes | Icon component (SVG, lucide-react, etc.) |
| `onClick` | `() => void` | Yes | Click handler function |
| `ariaLabel` | `string` | Yes | Accessibility label for screen readers |
| `disabled` | `boolean` | No | Disable the button (default: `false`) |

## Predefined Action Sets

The component includes predefined action sets for common pages:

### `homeQuickActions(onOpenModal)`
- **Add**: Add new transaction
- **Transfer**: Transfer money between wallets
- **Wallet**: Create new wallet

### `portfolioQuickActions(onOpenModal, onRefresh?)`
- **Add Investment**: Add new investment holding
- **Refresh**: Refresh market prices (optional)

### `transactionQuickActions(onOpenModal)`
- **Add**: Add new transaction
- **Transfer**: Transfer money between wallets

### `walletsQuickActions(onOpenModal)`
- **New Wallet**: Create new wallet
- **Transfer**: Transfer money between wallets

## Styling

### Default Styling

The component uses the following Tailwind classes:

```tsx
// Container
- flex sm:hidden              // Mobile only
- overflow-x-auto             // Horizontal scroll
- scrollbar-hide              // Hide scrollbar
- gap-3 px-4 py-3             // Spacing
- bg-white                    // White background
- border-b border-neutral-200 // Bottom border

// Button (each action)
- flex flex-col               // Vertical layout
- items-center justify-center // Center content
- min-w-[80px] min-h-[44px]   // Touch target size
- px-3 py-2                   // Padding
- rounded-lg                  // Rounded corners
- bg-white border border-neutral-200  // Border
- hover:bg-neutral-50         // Hover state
- active:bg-neutral-100 active:scale-95  // Active state
- transition-all duration-200 // Smooth transitions
```

### Custom Styling

You can override styles using the `className` prop:

```tsx
<QuickActions
  actions={actions}
  className="bg-primary-50 border-primary-200"
/>
```

## Accessibility

The component includes full accessibility support:

- **ARIA Labels**: Every action button has a descriptive `aria-label`
- **Navigation Region**: Container has `role="navigation"` and `aria-label`
- **Keyboard Navigation**: Full focus management with visible focus states
- **Touch Targets**: Minimum 44px for all buttons
- **Screen Readers**: Icons have `aria-hidden="true"` to avoid redundancy

```tsx
<button
  aria-label={action.ariaLabel}
  className="focus-visible:ring-2 focus-visible:ring-primary-500"
>
  <span aria-hidden="true">{icon}</span>
  <span>{label}</span>
</button>
```

## Integration with Modal System

The component works seamlessly with the existing modal system:

```tsx
import { ModalType } from "@/app/constants";

const handleOpenModal = (type: string) => {
  // Map action IDs to ModalType constants
  const modalMapping: Record<string, string> = {
    "add-transaction": ModalType.ADD_TRANSACTION,
    "transfer": ModalType.TRANSFER_MONEY,
    "new-wallet": ModalType.CREATE_WALLET,
  };

  setModalType(modalMapping[type] || type);
};
```

## Responsive Behavior

- **Mobile (< 640px)**: Visible with horizontal scroll
- **Desktop (≥ 640px)**: Hidden (`sm:hidden`)

Actions on desktop are typically available in the sidebar navigation.

## Performance Considerations

- **Lightweight**: No external dependencies
- **Optimized Renders**: Uses React.memo patterns for icons
- **Smooth Scrolling**: Native browser scrolling with momentum
- **CSS Transitions**: Hardware-accelerated transforms

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Full support with touch feedback

## Examples

See `QuickActions.usage.examples.tsx` for comprehensive usage examples including:

1. Basic usage with modal state
2. Custom action items
3. Icon-only mode
4. Home page integration
5. Portfolio page with refresh
6. Disabled states
7. Integration with ModalType constants

## Troubleshooting

### Actions not visible on mobile
- Check that you're not overriding the `flex sm:hidden` classes
- Verify parent container doesn't have `overflow: hidden`

### Icons not rendering
- Ensure icon components return valid JSX
- Check that icon SVG has proper `width` and `height` (24x24 recommended)

### Horizontal scroll not working
- Ensure `overflow-x-auto` is not being overridden
- Check that container has defined width

### TypeScript errors
- Import types: `import { type ActionItem } from "@/components/dashboard/QuickActions"`
- Ensure all required properties are provided in `ActionItem`

## Future Enhancements

Potential improvements for future versions:

- Haptic feedback on supported devices
- Long-press for secondary actions
- Drag-to-reorder functionality
- Action grouping with dividers
- Animation on scroll
- Custom action persistence

## Related Components

- `Button`: Primary button component for main actions
- `FloatingActionButton`: Alternative for single primary actions
- `BaseModal`: Modal system for action forms
- BalanceCard: Dashboard card component

## Support

For issues or questions:
1. Check this documentation
2. Review usage examples
3. Inspect the component source code
4. Check Tailwind config for available utilities
