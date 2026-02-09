# WealthJourney UI/UX Redesign - Implementation Plan

## Phase Status

- ✅ **Phase 1**: Design System Foundation (COMPLETED)
- ✅ **Phase 2**: Authentication Pages (COMPLETED)
- ✅ **Phase 3**: Dashboard Layout (COMPLETED)
- 🔄 **Phase 4**: Core Component Enhancements (IN PROGRESS)
- ⏳ **Phase 5**: Page-Specific Redesigns
- ⏳ **Phase 6**: Advanced Features
- ⏳ **Phase 7**: Performance & Polish

---

## Phase 4: Core Component Enhancements

### 4.1 Form Components Enhancement

#### 4.1.1 Create Enhanced Input Components

**File**: `src/wj-client/components/forms/enhanced/FormInput.tsx` (NEW)

**Requirements**:
- Floating label pattern on focus
- Inline validation with visual feedback
- Error message display below input
- Success state with checkmark icon
- Mobile-optimized touch targets (48px height)
- Proper `inputmode` for mobile keyboards
- ARIA labels and descriptions
- Dark mode support

**Features**:
```tsx
interface FormInputProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'tel' | 'number' | 'password';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  success?: boolean;
  disabled?: boolean;
  required?: boolean;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
  autoComplete?: string;
  inputMode?: 'text' | 'email' | 'tel' | 'numeric' | 'decimal';
}
```

**Styling**:
- Border: `border-neutral-300 dark:border-dark-border`
- Focus: `ring-2 ring-primary-500 border-primary-500`
- Error: `border-danger-500 ring-danger-500`
- Success: `border-success-500 ring-success-500`
- Background: `bg-white dark:bg-dark-surface`

---

#### 4.1.2 Create Enhanced Select Component

**File**: `src/wj-client/components/forms/enhanced/FormSelect.tsx` (NEW)

**Requirements**:
- Custom dropdown (not native select)
- Search/filter functionality
- Multi-select support
- Touch-friendly list items (44px min)
- Keyboard navigation (arrow keys, enter, escape)
- ARIA combobox pattern
- Grouped options support
- Loading state for async options

**Features**:
```tsx
interface FormSelectProps<T> {
  label: string;
  options: SelectOption<T>[];
  value: T | null;
  onChange: (value: T | null) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  searchable?: boolean;
  multiple?: boolean;
  loading?: boolean;
  groupBy?: (option: SelectOption<T>) => string;
}
```

---

#### 4.1.3 Create Form Field Wrapper

**File**: `src/wj-client/components/forms/enhanced/FormField.tsx` (NEW)

**Purpose**: Consistent layout for form fields with labels, errors, helpers

**Features**:
- Label with required indicator
- Helper text below label
- Error message below input
- Success message display
- Consistent spacing
- ARIA descriptions

---

#### 4.1.4 Create Form Validation Utilities

**File**: `src/wj-client/lib/validation/form-validation.ts` (NEW)

**Validators**:
- Email validation
- Phone number validation
- Currency amount validation
- Password strength validation
- Required field validation
- Min/max length validation
- Custom validation rules

---

### 4.2 Modal Component Enhancement

#### 4.2.1 Enhance BaseModal Component

**File**: `src/wj-client/components/modals/BaseModal.tsx` (UPDATE)

**Enhancements**:
- Improved swipe gestures (velocity-based)
- Better keyboard handling
- Focus trap improvements
- Animated backdrop (fade + scale)
- Mobile full-screen option
- Nested modal support
- Portal rendering for z-index
- Transition variants

**New Props**:
```tsx
interface BaseModalProps {
  // ... existing props
  variant?: 'centered' | 'bottom-sheet' | 'full-screen' | 'drawer';
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  preventBodyScroll?: boolean;
  animation?: 'fade' | 'slide' | 'scale' | 'none';
}
```

---

#### 4.2.2 Create Modal Stack Manager

**File**: `src/wj-client/components/modals/ModalStack.tsx` (NEW)

**Purpose**: Handle multiple modals, manage z-index, prevent scroll issues

---

### 4.3 Card Component Enhancement

#### 4.3.1 Create WealthCard Component

**File**: `src/wj-client/components/cards/WealthCard.tsx` (NEW)

**Purpose**: Specialized card for financial data display

**Features**:
- Gradient backgrounds optional
- Trend indicators (up/down)
- Percentage change badges
- Chart sparkline option
- Click to expand
- Mobile-optimized layout
- Skeleton loading state

**Variants**:
- Balance card (total balance, change indicator)
- Wallet card (wallet name, balance, actions)
- Transaction card (amount, category, date)
- Investment card (symbol, quantity, PnL)

---

#### 4.3.2 Create StatCard Component

**File**: `src/wj-client/components/cards/StatCard.tsx` (NEW)

**Purpose**: Display single metric with label, value, and trend

**Features**:
```tsx
interface StatCardProps {
  label: string;
  value: string | number;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  icon?: React.ReactNode;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'danger' | 'warning';
  onClick?: () => void;
}
```

---

### 4.4 Button Component Enhancement

#### 4.4.1 Enhance Button Component

**File**: `src/wj-client/components/Button.tsx` (UPDATE)

**Enhancements**:
- Add icon support (left/right)
- Add loading spinner
- Add success state
- Better focus indicators
- Touch feedback (active scale)
- Disable with reason
- Haptic feedback (mobile)

**New Variants**:
- `ghost` - Transparent background
- `link` - Text-only button
- `icon-only` - Square button with icon

---

### 4.5 Loading States

#### 4.5.1 Create Skeleton Components

**File**: `src/wj-client/components/loading/skeleton/` (NEW DIRECTORY)

**Components**:
- `SkeletonText.tsx` - Text placeholder
- `SkeletonCard.tsx` - Card placeholder
- `SkeletonList.tsx` - List item placeholder
- `SkeletonAvatar.tsx` - Avatar placeholder
- `SkeletonTable.tsx` - Table placeholder

**Features**:
- Shimmer animation
- Random width variation
- Pulse animation option
- Dark mode support

---

#### 4.5.2 Create Spinner Component

**File**: `src/wj-client/components/loading/Spinner.tsx` (NEW)

**Variants**:
- Size: `sm` | `md` | `lg` | `xl`
- Color: `primary` | `white` | `current`
- Overlay option

---

### 4.6 Empty State Components

#### 4.6.1 Create EmptyState Component

**File**: `src/wj-client/components/feedback/EmptyState.tsx` (NEW)

**Features**:
- Custom illustration/icon
- Title and description
- Primary CTA button
- Secondary action link
- Multiple variants (no-data, no-results, no-connection)

---

#### 4.6.2 Create ErrorState Component

**File**: `src/wj-client/components/feedback/ErrorState.tsx` (NEW)

**Features**:
- Error illustration/icon
- Error message display
- Retry action
- Report issue action
- Stack trace toggle (dev mode)

---

## Phase 5: Page-Specific Redesigns

### 5.1 Transaction Page Redesign

#### 5.1.1 Transaction List Mobile View

**File**: `src/wj-client/app/dashboard/transaction/page.tsx` (UPDATE)

**Enhancements**:
- Card-based layout on mobile
- Swipe actions (left: delete, right: edit)
- Pull-to-refresh
- Infinite scroll (replace pagination)
- Group by date (Today, Yesterday, This Week, etc.)
- Quick filters chips
- Search bar with debounce
- FAB for quick add

**Mobile Card Design**:
```tsx
<div className="bg-white dark:bg-dark-surface rounded-xl p-4 shadow-sm mb-3 active:scale-[0.98] transition-transform">
  {/* Top row: Category icon, amount, date */}
  <div className="flex items-center justify-between mb-2">
    <div className="flex items-center gap-3">
      {/* Category icon */}
      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
        {/* Icon */}
      </div>
      <div>
        <p className="font-medium text-neutral-900 dark:text-dark-text">Category Name</p>
        <p className="text-xs text-neutral-500">Wallet Name</p>
      </div>
    </div>
    <div className="text-right">
      <p className="font-semibold text-danger-600">-₫500,000</p>
      <p className="text-xs text-neutral-500">10:30 AM</p>
    </div>
  </div>
  {/* Bottom row: Note, tags */}
  {note && (
    <p className="text-sm text-neutral-600 dark:text-dark-text-secondary truncate">
      {note}
    </p>
  )}
</div>
```

---

#### 5.1.2 Transaction Filters Mobile Modal

**File**: `src/wj-client/app/dashboard/transaction/TransactionFilterModal.tsx` (UPDATE)

**Enhancements**:
- Full-screen on mobile
- Collapsible filter sections
- Range sliders for amount
- Date range picker
- Multi-select for categories
- Clear all button
- Active filter count badge

---

#### 5.1.3 Add Transaction Form Enhancement

**File**: `src/wj-client/components/modals/forms/AddTransactionForm.tsx` (UPDATE)

**Enhancements**:
- Step-by-step wizard on mobile
- Amount calculator/keypad
- Category quick-select with icons
- Wallet selector with balance preview
- Date/time picker with presets
- Recurring transaction option
- Receipt image upload
- Split transaction option

---

### 5.2 Wallet Page Redesign

#### 5.2.1 Wallet Card Mobile Enhancement

**File**: `src/wj-client/app/dashboard/wallets/WalletCard.tsx` (UPDATE)

**Enhancements**:
- Tap to expand for details
- Swipe actions (transfer, edit, delete)
- Quick actions overlay on long press
- Balance visibility toggle
- Currency conversion display
- Transaction count badge

**Card Layout**:
```tsx
<div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-5 shadow-lg relative overflow-hidden">
  {/* Background pattern */}
  <div className="absolute inset-0 opacity-10">
    {/* Decorative pattern */}
  </div>

  {/* Content */}
  <div className="relative z-10">
    {/* Top: Wallet name, type badge */}
    <div className="flex justify-between items-start mb-8">
      <div>
        <h3 className="text-white font-semibold text-lg">Wallet Name</h3>
        <span className="text-primary-200 text-xs">Checking Account</span>
      </div>
      <div className="flex gap-2">
        {/* Action buttons */}
      </div>
    </div>

    {/* Middle: Balance */}
    <div className="mb-4">
      <p className="text-primary-200 text-xs mb-1">Available Balance</p>
      <p className="text-white text-3xl font-bold font-tabular">₫15,500,000</p>
    </div>

    {/* Bottom: Account number, currency */}
    <div className="flex justify-between items-end">
      <p className="text-primary-200 text-sm">•••• 4589</p>
      <p className="text-white font-medium">VND</p>
    </div>
  </div>
</div>
```

---

#### 5.2.2 Create Wallet List View

**File**: `src/wj-client/app/dashboard/wallets/WalletListView.tsx` (NEW)

**Features**:
- List view for many wallets
- Quick balance transfer
- Total balance summary
- Filter by wallet type
- Sort by balance/name

---

### 5.3 Portfolio Page Redesign

#### 5.3.1 Portfolio Summary Card

**File**: `src/wj-client/app/dashboard/portfolio/components/PortfolioSummary.tsx` (UPDATE)

**Enhancements**:
- Animated number counter
- Sparkline chart
- Asset allocation donut chart
- Top performer badge
- Quick actions (add investment, refresh prices)

---

#### 5.3.2 Investment Card Mobile

**File**: `src/wj-client/app/dashboard/portfolio/components/InvestmentCard.tsx` (UPDATE)

**Enhancements**:
- Compact card layout
- PnL color coding (green/red)
- Percentage change badge
- Tap to expand for details
- Swipe actions (buy more, sell, edit)

**Card Layout**:
```tsx
<div className="bg-white dark:bg-dark-surface rounded-xl p-4 shadow-sm mb-3">
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-3">
      {/* Logo */}
      <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center font-bold text-neutral-700">
        VC
      </div>
      <div>
        <p className="font-medium text-neutral-900 dark:text-dark-text">VCB</p>
        <p className="text-xs text-neutral-500">Vietcombank</p>
      </div>
    </div>
    <div className="text-right">
      <p className="font-semibold text-success-600">+12.5%</p>
      <p className="text-xs text-neutral-500">Today</p>
    </div>
  </div>

  <div className="flex justify-between items-end">
    <div>
      <p className="text-xs text-neutral-500 mb-1">Current Value</p>
      <p className="font-bold text-lg text-neutral-900 dark:text-dark-text font-tabular">₫25,500,000</p>
    </div>
    <div className="text-right">
      <p className="text-xs text-neutral-500 mb-1">Total PnL</p>
      <p className="font-semibold text-success-600 font-tabular">+₫2,500,000</p>
    </div>
  </div>
</div>
```

---

#### 5.3.3 Chart Components

**File**: `src/wj-client/components/charts/` (NEW DIRECTORY)

**Components**:
- `LineChart.tsx` - Portfolio performance over time
- `DonutChart.tsx` - Asset allocation
- `BarChart.tsx` - Sector allocation
- `CandlestickChart.tsx` - Stock price history
- `Sparkline.tsx` - Mini trend indicator

**Library**: Use `recharts` or create custom SVG charts

---

### 5.4 Budget Page Redesign

#### 5.4.1 Budget Progress Card

**File**: `src/wj-client/app/dashboard/budget/BudgetCard.tsx` (UPDATE)

**Enhancements**:
- Circular progress indicator
- Animated progress bar
- Over-budget warning
- Days remaining badge
- Quick add expense button
- Tap to view category breakdown

---

#### 5.4.2 Budget Category Breakdown

**File**: `src/wj-client/app/dashboard/budget/CategoryBreakdown.tsx` (NEW)

**Features**:
- List of category budgets
- Progress bars per category
- Spent vs remaining display
- Add expense per category
- Edit budget amount

---

### 5.5 Report Page Redesign

#### 5.5.1 Report Period Selector

**File**: `src/wj-client/app/dashboard/report/PeriodSelector.tsx` (NEW)

**Features**:
- Preset periods (This Month, Last Month, This Quarter, Custom)
- Date range picker
- Compare with previous period toggle
- Quick navigation arrows

---

#### 5.5.2 Report Summary Cards

**File**: `src/wj-client/app/dashboard/report/SummaryCards.tsx` (NEW)

**Metrics**:
- Total Income
- Total Expenses
- Net Savings
- Savings Rate
- Top Expense Category
- Comparison with previous period

---

## Phase 6: Advanced Features

### 6.1 Search Implementation

#### 6.1.1 Global Search

**File**: `src/wj-client/components/search/GlobalSearch.tsx` (NEW)

**Features**:
- Keyboard shortcut (Cmd/Ctrl + K)
- Search across transactions, wallets, investments
- Recent searches
- Search suggestions
- Quick navigation to results

---

#### 6.1.2 Search Results Display

**File**: `src/wj-client/components/search/SearchResults.tsx` (NEW)

**Features**:
- Grouped results by type
- Highlighted search terms
- Quick actions from results
- Empty state for no results

---

### 6.2 Notifications System

#### 6.2.1 Toast Notifications

**File**: `src/wj-client/components/notifications/Toast.tsx` (NEW)

**Variants**:
- Success
- Error
- Warning
- Info

**Features**:
- Stack multiple toasts
- Auto-dismiss with timer
- Manual dismiss action
- Progress bar for auto-dismiss
- Slide in/out animations
- Position options (top-right, bottom-right, etc.)

---

#### 6.2.2 Notification Provider

**File**: `src/wj-client/contexts/NotificationContext.tsx` (NEW)

**API**:
```tsx
const { toast } = useNotification();

toast.success('Transaction added successfully');
toast.error('Failed to save. Please try again.');
toast.warning('Budget limit exceeded');
toast.info('New feature available');
```

---

### 6.3 Onboarding Flow

#### 6.3.1 Welcome Tour

**File**: `src/wj-client/components/onboarding/Tour.tsx` (NEW)

**Steps**:
1. Welcome to WealthJourney
2. Add your first wallet
3. Record your first transaction
4. Set up your budget
5. Explore your portfolio (optional)

**Features**:
- Skip option
- Progress indicator
- Tooltips highlighting UI elements
- Celebration on completion

---

#### 6.3.2 Feature Discovery

**File**: `src/wj-client/components/onboarding/FeatureDiscovery.tsx` (NEW)

**Features**:
- Contextual tips
- "What's new" highlights
- Interactive tutorials
- Video walkthrough option

---

### 6.4 Export & Sharing

#### 6.4.1 Export Options

**File**: `src/wj-client/components/export/ExportDialog.tsx` (NEW)

**Formats**:
- CSV
- PDF (with charts)
- Excel

**Options**:
- Date range selection
- Include/exclude categories
- Include charts
- Custom branding

---

#### 6.4.2 Share Report

**File**: `src/wj-client/components/share/ShareDialog.tsx` (NEW)

**Features**:
- Generate shareable link
- Email report
- Print/PDF export
- Social media share (summary card)

---

## Phase 7: Performance & Polish

### 7.1 Performance Optimization

#### 7.1.1 Code Splitting

**Actions**:
- Route-based splitting (automatic with Next.js)
- Component lazy loading
- Chart library lazy loading
- Heavy components dynamic import

---

#### 7.1.2 Image Optimization

**Actions**:
- Use Next.js Image component everywhere
- Implement WebP format
- Add blur placeholders
- Lazy load below-fold images
- Responsive image sizes

---

#### 7.1.3 List Virtualization

**File**: `src/wj-client/components/lists/VirtualList.tsx` (NEW)

**Library**: `react-window` or `react-virtuoso`

**Use for**:
- Transaction lists (100+ items)
- Investment lists
- Budget categories
- Search results

---

#### 7.1.4 Data Fetching Optimization

**Actions**:
- Implement React Query caching
- Add stale-time for data
- Prefetch on hover
- Background refetch
- Optimistic updates

---

### 7.2 Analytics & Monitoring

#### 7.2.1 Error Tracking

**Tool**: Sentry or similar

**Track**:
- JavaScript errors
- API failures
- Performance issues
- User frustration (rage clicks)

---

#### 7.2.2 Analytics

**Tool**: Google Analytics 4 or Plausible

**Track**:
- Page views
- Feature usage
- Conversion funnels
- User flows
- Custom events

---

### 7.3 Testing

#### 7.3.1 Visual Regression Testing

**Tool**: Chromatic with Storybook

**Setup**:
- Create Storybook stories for all components
- Set up Chromatic for CI/CD
- Review visual changes on PRs

---

#### 7.3.2 E2E Testing

**Tool**: Playwright

**Test Scenarios**:
- Login flow
- Add transaction
- Create wallet
- View portfolio
- Filter transactions
- Dark mode toggle

---

#### 7.3.3 Accessibility Testing

**Tools**:
- axe-core for automated tests
- Manual keyboard navigation tests
- Screen reader testing (NVDA, VoiceOver)

---

### 7.4 Documentation

#### 7.4.1 Component Storybook

**File**: `src/wj-client/.storybook/` (NEW DIRECTORY)

**Stories for**:
- All components
- Different variants
- Interactive states
- Dark mode

---

#### 7.4.2 API Documentation

**File**: `docs/API.md` (NEW)

**Document**:
- Component props
- Usage examples
- Best practices
- Migration guides

---

## Implementation Order Priority

### High Priority (Do First)
1. ✅ Design System (COMPLETED)
2. ✅ Auth Pages (COMPLETED)
3. ✅ Dashboard Layout (COMPLETED)
4. 🔲 Form Components Enhancement
5. 🔲 Modal Component Enhancement
6. 🔲 Transaction Page Mobile View
7. 🔲 Loading States (Skeletons)
8. 🔲 Empty/Error States

### Medium Priority
9. 🔲 Wallet Page Enhancement
10. 🔲 Portfolio Page Enhancement
11. 🔲 Budget Page Enhancement
12. 🔲 Report Page Enhancement
13. 🔲 Toast Notifications
14. 🔲 Search Implementation

### Low Priority (Nice to Have)
15. 🔲 Onboarding Flow
16. 🔲 Export & Sharing
17. 🔲 Advanced Charts
18. 🔲 Analytics Integration
19. 🔲 E2E Tests
20. 🔲 Storybook Setup

---

## File Structure Reference

```
src/wj-client/
├── components/
│   ├── forms/
│   │   ├── enhanced/           # NEW: Enhanced form components
│   │   │   ├── FormInput.tsx
│   │   │   ├── FormSelect.tsx
│   │   │   ├── FormField.tsx
│   │   │   └── FormDatePicker.tsx
│   │   └── ...existing...
│   ├── modals/
│   │   ├── BaseModal.tsx       # UPDATE: Enhanced
│   │   └── ...existing...
│   ├── cards/                  # NEW: Card components
│   │   ├── WealthCard.tsx
│   │   ├── StatCard.tsx
│   │   └── TransactionCard.tsx
│   ├── charts/                 # NEW: Chart components
│   │   ├── LineChart.tsx
│   │   ├── DonutChart.tsx
│   │   └── Sparkline.tsx
│   ├── loading/
│   │   ├── skeleton/           # NEW: Skeleton components
│   │   │   ├── SkeletonText.tsx
│   │   │   ├── SkeletonCard.tsx
│   │   │   └── SkeletonList.tsx
│   │   └── Spinner.tsx         # NEW
│   ├── feedback/               # NEW: Feedback components
│   │   ├── EmptyState.tsx
│   │   ├── ErrorState.tsx
│   │   └── SuccessState.tsx
│   ├── search/                 # NEW: Search components
│   │   ├── GlobalSearch.tsx
│   │   └── SearchResults.tsx
│   ├── notifications/          # NEW: Toast notifications
│   │   ├── Toast.tsx
│   │   └── ToastProvider.tsx
│   ├── onboarding/             # NEW: Onboarding components
│   │   ├── Tour.tsx
│   │   └── FeatureDiscovery.tsx
│   ├── export/                 # NEW: Export components
│   │   └── ExportDialog.tsx
│   └── lists/                  # NEW: Virtual lists
│       └── VirtualList.tsx
├── lib/
│   └── validation/             # NEW: Validation utilities
│       └── form-validation.ts
├── contexts/                   # NEW
│   └── NotificationContext.tsx
├── app/
│   └── dashboard/
│       ├── transaction/
│       │   ├── page.tsx        # UPDATE: Mobile view
│       │   └── ...existing...
│       ├── wallets/
│       │   ├── WalletCard.tsx  # UPDATE: Enhanced
│       │   └── WalletListView.tsx # NEW
│       ├── portfolio/
│       │   ├── page.tsx        # UPDATE: Mobile view
│       │   └── components/
│       │       ├── InvestmentCard.tsx # UPDATE
│       │       └── ...existing...
│       ├── budget/
│       │   ├── BudgetCard.tsx  # UPDATE
│       │   └── CategoryBreakdown.tsx # NEW
│       └── report/
│           ├── page.tsx        # UPDATE
│           ├── PeriodSelector.tsx # NEW
│           └── SummaryCards.tsx # NEW
├── .storybook/                 # NEW: Storybook setup
│   ├── main.ts
│   └── preview.ts
└── ...existing...
```

---

## Success Criteria

### Visual
- [ ] All pages consistent with design system
- [ ] Mobile layouts polished at 375px, 390px, 414px
- [ ] Dark mode fully functional
- [ ] Smooth animations (60fps)

### UX
- [ ] Touch targets minimum 44x44px
- [ ] Loading states for all async operations
- [ ] Empty states with CTAs
- [ ] Error states with recovery options

### Accessibility
- [ ] WCAG 2.1 AA compliant
- [ ] Keyboard navigation works
- [ ] Screen reader friendly
- [ ] Color contrast sufficient

### Performance
- [ ] Lighthouse score >90
- [ ] First Contentful Paint <1.5s
- [ ] Time to Interactive <3s
- [ ] No layout shifts

---

## Estimated Timeline

| Phase | Tasks | Est. Time |
|-------|-------|-----------|
| Phase 4: Core Components | 8 tasks | 2-3 days |
| Phase 5: Page Redesigns | 12 tasks | 4-5 days |
| Phase 6: Advanced Features | 8 tasks | 3-4 days |
| Phase 7: Performance | 6 tasks | 2-3 days |
| **Total** | **34 tasks** | **11-15 days** |

---

## Notes

- All components should be TypeScript with proper props typing
- Use Tailwind CSS for all styling
- Follow mobile-first approach
- Test on real devices (iOS Safari, Chrome Mobile)
- Each phase should be tested before moving to next
- Create PRs per phase for code review
- Update DESIGN_SYSTEM.md as patterns emerge

---

**Last Updated**: 2026-02-04
**Status**: Ready for Implementation
**Next Step**: Phase 4.1 - Form Components Enhancement
