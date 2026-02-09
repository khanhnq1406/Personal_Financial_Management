# WealthJourney Design System

## Overview

This design system provides a comprehensive set of guidelines, components, and patterns for building a professional fintech application with a mobile-first approach.

## Design Philosophy

- **Mobile-First**: Design for mobile devices first, then enhance for larger screens
- **Accessibility First**: WCAG 2.1 AA compliance minimum
- **Performance Optimized**: 60fps animations, minimal bundle size
- **Touch-Friendly**: Minimum 44x44px touch targets
- **Professional Fintech**: Trust, clarity, and sophistication

## Color Palette

### Primary Colors
- **Primary Blue**: `#0EA5E9` (Sky Blue) - Trust, stability, professionalism
- **Primary Dark**: `#0284C7` - Hover states
- **Primary Darker**: `#0369A1` - Active states

### Accent Colors
- **Accent Green**: `#22C55E` - Growth, profit, positive actions
- **Accent Dark**: `#16A34A` - Hover states

### Secondary Colors
- **Purple**: `#A855F7` - Premium features, upgrades

### Semantic Colors
- **Success**: `#22C55E` (Green)
- **Danger**: `#EF4444` (Red)
- **Warning**: `#F59E0B` (Amber)

### Neutral Scale
- **Background**: `#FAFAFA` (Neutral 50)
- **Surface**: `#FFFFFF` (White)
- **Text Primary**: `#171717` (Neutral 900)
- **Text Secondary**: `#737373` (Neutral 500)
- **Border**: `#E5E5E5` (Neutral 200)

### Dark Mode
- **Background**: `#0A0A0A`
- **Surface**: `#171717`
- **Text**: `#FAFAFA`
- **Text Secondary**: `#A3A3A3`

## Typography

### Font Family
- **Primary**: Plus Jakarta Sans (Google Fonts)
- **Fallback**: System sans-serif

### Type Scale

#### Display Sizes (Hero/Headlines)
| Class | Size | Line Height | Weight | Use Case |
|-------|------|-------------|--------|----------|
| `.text-display-3xl` | 3rem | 1 | 700 | Page titles |
| `.text-display-2xl` | 2.5rem | 1 | 700 | Large headlines |
| `.text-display-xl` | 2rem | 2.5rem | 700 | Section headers |
| `.text-display-lg` | 1.5rem | 2rem | 700 | Card titles |
| `.text-display-md` | 1.125rem | 1.75rem | 600 | Subsection headers |
| `.text-display-sm` | 1rem | 1.5rem | 600 | Labels |
| `.text-display-xs` | 0.875rem | 1.25rem | 600 | Small labels |

#### Tabular Numbers (Financial Data)
| Class | Size | Line Height | Use Case |
|-------|------|-------------|----------|
| `.text-tabular-xl` | 1.25rem | 1.75rem | Large amounts |
| `.text-tabular-lg` | 1.125rem | 1.75rem | Prices |
| `.text-tabular-md` | 1rem | 1.5rem | Standard numbers |
| `.text-tabular-sm` | 0.875rem | 1.25rem | Compact numbers |
| `.text-tabular-xs` | 0.75rem | 1rem | Small data |

### Typography Guidelines
- **Line Length**: Max 65-75 characters for body text
- **Line Height**: 1.5-1.75 for readability
- **Letter Spacing**: 0.01em for display, 0 for body
- **Paragraph Spacing**: 1.5rem between paragraphs

## Spacing System

### Mobile Spacing (Compact)
| Class | Value | Use Case |
|-------|-------|----------|
| `p-mobile-xs` | 6px | Tight spacing |
| `p-mobile-sm` | 8px | Small spacing |
| `p-mobile-md` | 12px | Default spacing |
| `p-mobile-lg` | 16px | Comfortable spacing |
| `p-mobile-xl` | 24px | Large spacing |

### Desktop Spacing (Comfortable)
| Class | Value | Use Case |
|-------|-------|----------|
| `p-desktop-sm` | 16px | Small spacing |
| `p-desktop-md` | 24px | Default spacing |
| `p-desktop-lg` | 32px | Large spacing |
| `p-desktop-xl` | 48px | Extra large spacing |

### Touch Targets
| Class | Value | Use Case |
|-------|-------|----------|
| `.touch-target` | 44x44px | Minimum touch target |
| `.touch-target-lg` | 48x48px | Comfortable touch |

## Component Patterns

### Cards
```tsx
<BaseCard mobileOptimized>
  {/* Content */}
</BaseCard>
```

**Props:**
- `mobileOptimized`: Tighter padding on mobile
- `hover`: Add hover effect
- `padding`: "none" | "sm" | "md" | "lg"
- `shadow`: "sm" | "md" | "lg" | "none"

### Buttons
```tsx
<Button
  type={ButtonType.PRIMARY}
  loading={isLoading}
  className="touch-target"
>
  Action
</Button>
```

**Types:**
- `PRIMARY`: Main actions (primary blue)
- `SECONDARY`: Secondary actions (outline)
- `DANGER`: Destructive actions (red)
- `GHOST`: Subtle actions

### Modals
```tsx
<BaseModal
  isOpen={isOpen}
  onClose={handleClose}
  title="Modal Title"
  bottomSheetOnMobile
>
  {/* Content */}
</BaseModal>
```

**Features:**
- Bottom sheet on mobile
- Swipe to dismiss
- Keyboard handling
- Focus trap

### Forms
```tsx
<FormInput
  label="Label"
  placeholder="Placeholder"
  error={error}
  required
/>
```

**Features:**
- Floating labels on focus
- Inline validation
- Clear error messages
- Proper labels for accessibility

## Layout Patterns

### Mobile-First Grid
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-mobile-md sm:gap-desktop-md">
  {/* Items */}
</div>
```

### Responsive Container
```tsx
<div className="w-full max-w-md sm:max-w-lg lg:max-w-4xl mx-auto px-mobile-lg sm:px-desktop-lg">
  {/* Content */}
</div>
```

### Safe Areas
```tsx
<div className="pb-safe-bottom">
  {/* Content above bottom nav */}
</div>
```

## Animation Guidelines

### Duration
- **Micro-interactions**: 150ms
- **Default**: 200ms
- **Complex**: 300ms

### Easing
- **Ease-out**: Exiting animations
- **Ease-in**: Entering animations
- **Smooth**: General transitions

### Animations
```tsx
// Fade in
<div className="animate-fade-in">Content</div>

// Slide up
<div className="animate-slide-in-up">Content</div>

// Scale in
<div className="animate-scale-in">Content</div>

// Subtle pulse
<div className="animate-pulse-subtle">Loading...</div>
```

## Accessibility

### Minimum Standards
- **Color Contrast**: 4.5:1 for normal text, 3:1 for large text
- **Touch Targets**: Minimum 44x44px
- **Focus Indicators**: Visible focus rings
- **Labels**: All inputs have proper labels
- **ARIA**: Proper ARIA attributes

### Keyboard Navigation
- **Tab Order**: Logical flow
- **Focus Traps**: In modals
- **Shortcuts**: Common patterns (Esc to close)

### Screen Readers
- **Semantic HTML**: Proper heading hierarchy
- **ARIA Labels**: For icon-only buttons
- **Announcements**: For dynamic content

## Mobile Best Practices

### Touch Interactions
- **Minimum Size**: 44x44px (iOS guidelines)
- **Spacing**: 8px gap between targets
- **Feedback**: Visual + haptic when possible

### Layout
- **Single Column**: Default on mobile
- **Progressive Disclosure**: Hide less important content
- **Sticky Headers**: For long lists
- **Bottom Navigation**: For primary actions

### Performance
- **Lazy Loading**: Below fold content
- **Code Splitting**: Route-based chunks
- **Image Optimization**: WebP + srcset
- **Reduced Motion**: Respect preferences

## Breakpoints

| Name | Size | Devices |
|------|------|---------|
| `xs` | 375px | Small phones |
| `sm` | 640px | Landscape phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large desktops |

## Icon System

### Overview

The icon system is built on standardized SVG components with consistent styling for a professional fintech aesthetic. All icons use a centralized base component for proper sizing, accessibility, and theming support.

### Usage

Import specific icons from the icons directory:

```tsx
import { WalletIcon, EditIcon, IncomeIcon } from "@/components/icons";

<WalletIcon size="md" ariaLabel="Wallet" />
```

### Icon Sizes

| Preset | Tailwind | Use Case |
|-------|---------|----------|
| `xs` | `w-3 h-3` | Compact, table cells |
| `sm` | `w-4 h-4` | Buttons with text |
| `md` | `w-5 h-5` | Default size |
| `lg` | `w-6 h-6` | Standalone buttons |
| `xl` | `w-8 h-8` | Hero sections |

### Icon Categories

**UI Icons** (16 icons):
- Check, X, Chevron Down/Left/Right, Plus, Minus
- Search, Refresh, Loading Spinner
- Sun, Moon, Desktop (theme toggle)
- Alert Triangle, Info (toast notifications)

**Navigation Icons** (6 icons):
- Home, Transactions, Wallets, Portfolio, Reports, Budget

**Action Icons** (6 icons):
- Edit, Delete, Eye (show/hide), User, Logout

**Finance Icons** (6 icons):
- Income (success color), Expense (danger color), Transfer, Savings, Percent, Category

### Specifications

- **Style**: Stroke-based (not filled)
- **ViewBox**: 24x24 standard
- **Stroke Width**: 2px
- **Line Caps/Joins**: Round
- **Color**: `stroke="currentColor"` for theming
- **Animation**: `animate-spin` for LoadingSpinnerIcon

### Accessibility

All icons include proper ARIA attributes:

```tsx
// Interactive icon (button, link)
<EditIcon ariaLabel="Edit transaction" />

// Decorative icon (no screen reader announcement)
<CheckIcon decorative={true} />
```

### Examples

```tsx
// Finance icons with semantic colors
<IncomeIcon className="text-success-600" />
<ExpenseIcon className="text-danger-600" />

// Size variation
<WalletIcon size="sm" />  // Small
<WalletIcon size="md" />  // Default
<WalletIcon size="lg" />  // Large

// Custom color
<PlusIcon className="text-primary-600" />

// Decorative (no aria-label)
<ChevronDownIcon decorative />
```

### Components Using Icon System

- **Button**: LoadingSpinnerIcon, CheckIcon
- **ThemeToggle**: SunIcon, MoonIcon, DesktopIcon
- **Toast**: CheckIcon, XIcon, AlertTriangleIcon, InfoIcon
- **Select**: XIcon, ChevronDownIcon, LoadingSpinnerIcon
- **FloatingActionButton**: PlusIcon, XIcon
- **LoadingSpinner**: LoadingSpinnerIcon
- **BottomNav**: HomeIcon, TransactionIcon, WalletIcon, PortfolioIcon, ReportsIcon

## Financial Data Display

### Currency Formatting
```tsx
import { formatCurrency } from '@/utils/currency-formatter';

const amount = formatCurrency(1234.56, 'USD'); // "$1,234.56"
```

### Percentage Display
```tsx
const percent = (value / total * 100).toFixed(2) + '%';
```

### Trends
```tsx
// Positive trend
<span className="text-success flex items-center gap-1">
  <TrendingUpIcon className="w-4 h-4" />
  +12.5%
</span>

// Negative trend
<span className="text-danger flex items-center gap-1">
  <TrendingDownIcon className="w-4 h-4" />
  -8.3%
</span>
```

## Common Patterns

### Loading States
```tsx
// Skeleton loading
<div className="animate-pulse bg-neutral-200 rounded h-4" />

// Spinner
<Spinner className="w-6 h-6" />

// Full page loader
<FullPageLoading />
```

### Empty States
```tsx
<BaseCard className="text-center py-12">
  <EmptyStateIcon className="w-16 h-16 mx-auto mb-4 text-neutral-400" />
  <h3 className="text-lg font-semibold mb-2">No Data</h3>
  <p className="text-neutral-500 mb-4">Get started by adding your first item.</p>
  <Button onClick={onAdd}>Add Item</Button>
</BaseCard>
```

### Error States
```tsx
<BaseCard className="text-center py-12">
  <ErrorIcon className="w-16 h-16 mx-auto mb-4 text-danger-500" />
  <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
  <p className="text-neutral-500 mb-4">{error.message}</p>
  <Button onClick={onRetry}>Try Again</Button>
</BaseCard>
```

## Dark Mode

### Implementation
```tsx
// Toggle dark mode
const [isDark, setIsDark] = useState(false);

<div className={isDark ? 'dark' : ''}>
  {/* Content */}
</div>
```

### Guidelines
- Test all components in both modes
- Ensure sufficient contrast in both
- Use semantic color tokens
- Smooth transitions between modes

## Performance Guidelines

### Optimization
- **Code Splitting**: Route-based chunks
- **Tree Shaking**: Remove unused code
- **Image Optimization**: WebP, lazy loading
- **Memoization**: React.memo, useMemo, useCallback
- **Virtual Scrolling**: For long lists (>100 items)

### Budgets
- **Initial JS**: <200KB gzipped
- **First Paint**: <1.5s
- **Interactive**: <3s
- **Lighthouse**: >90 score

## Testing

### Visual Regression
- Storybook for components
- Chromatic for testing
- Multiple breakpoints

### Accessibility
- axe-core for automated tests
- Manual keyboard navigation
- Screen reader testing

### Cross-Browser
- Chrome, Firefox, Safari
- iOS Safari, Android Chrome
- Different screen sizes

## Resources

### Tools
- **Figma**: Design files
- **Storybook**: Component documentation
- **Chromatic**: Visual testing

### References
- [Tailwind CSS](https://tailwindcss.com/docs)
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design](https://material.io/design)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)

---

**Version**: 2.0.0
**Last Updated**: 2026-02-04
**Maintainer**: WealthJourney Team
