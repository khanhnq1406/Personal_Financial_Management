/**
 * BaseCard Component - Usage Examples
 *
 * This file demonstrates all the enhanced features of the BaseCard component
 * including mobile optimization, collapsible content, and responsive design.
 */

import { BaseCard } from "./BaseCard";

/**
 * Example 1: Basic Usage (Backward Compatible)
 *
 * Standard card with default padding and shadow
 */
export function BasicCardExample() {
  return (
    <BaseCard>
      <p>This is a basic card with default settings</p>
    </BaseCard>
  );
}

/**
 * Example 2: Mobile-Optimized Card
 *
 * Reduces padding on mobile and adjusts border radius
 * - Mobile: p-3, rounded-sm
 * - Desktop: p-6, rounded-lg
 */
export function MobileOptimizedExample() {
  return (
    <BaseCard mobileOptimized padding="md">
      <h3 className="text-lg font-semibold mb-2">Mobile Optimized</h3>
      <p className="text-neutral-600">
        This card has tighter padding on mobile (p-3) and standard padding on desktop (p-6)
      </p>
    </BaseCard>
  );
}

/**
 * Example 3: Collapsible Card (Always)
 *
 * Card can be collapsed/expanded on all screen sizes
 * Features: Chevron icon, smooth transitions, accessible toggle
 */
export function CollapsibleCardExample() {
  return (
    <BaseCard
      collapsible
      defaultCollapsed={false}
      collapseAriaLabel="Toggle account details"
    >
      <h3 className="text-lg font-semibold">Account Balance</h3>
      <p className="text-2xl font-bold text-primary-600 mt-2">₫10,234,567</p>
      <div className="mt-4 space-y-2">
        <p className="text-sm text-neutral-600">Income: +₫5,000,000</p>
        <p className="text-sm text-neutral-600">Expenses: -₫2,500,000</p>
      </div>
    </BaseCard>
  );
}

/**
 * Example 4: Mobile-Only Collapsible
 *
 * Card is collapsible only on mobile (screens < 768px)
 * Always expanded on desktop with no chevron shown
 */
export function MobileCollapsibleExample() {
  return (
    <BaseCard
      collapsibleOnMobile
      defaultCollapsed={true}
      collapsedHeader={
        <div>
          <h3 className="text-lg font-semibold">Quick Stats</h3>
          <p className="text-sm text-neutral-500">Tap to expand</p>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <p className="text-sm text-neutral-500">Total Balance</p>
          <p className="text-xl font-bold">₫10,234,567</p>
        </div>
        <div>
          <p className="text-sm text-neutral-500">Monthly Change</p>
          <p className="text-xl font-bold text-success-600">+₫2,500,000</p>
        </div>
        <div>
          <p className="text-sm text-neutral-500">Active Wallets</p>
          <p className="text-xl font-bold">5</p>
        </div>
      </div>
    </BaseCard>
  );
}

/**
 * Example 5: Interactive Card with Hover
 *
 * Card responds to hover with shadow elevation
 */
export function InteractiveCardExample() {
  const handleClick = () => {
    console.log("Card clicked!");
  };

  return (
    <BaseCard
      hover
      onClick={handleClick}
      padding="lg"
      shadow="md"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Click Me</h3>
          <p className="text-neutral-600">I have hover effects!</p>
        </div>
        <svg
          className="w-6 h-6 text-primary-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </BaseCard>
  );
}

/**
 * Example 6: No Mobile Margin
 *
 * Removes bottom margin on mobile for tighter stacking
 * Useful for card grids or consecutive sections
 */
export function NoMobileMarginExample() {
  return (
    <div className="space-y-4">
      <BaseCard noMobileMargin>
        <p>First card with no mobile margin</p>
      </BaseCard>
      <BaseCard noMobileMargin>
        <p>Second card stacks tightly on mobile</p>
      </BaseCard>
      <BaseCard>
        <p>Third card has normal spacing</p>
      </BaseCard>
    </div>
  );
}

/**
 * Example 7: Custom Padding and Shadow
 *
 * Fine-tune spacing and elevation
 */
export function CustomSpacingExample() {
  return (
    <div className="space-y-4">
      <BaseCard padding="sm" shadow="sm">
        <p>Small padding, subtle shadow</p>
      </BaseCard>
      <BaseCard padding="md" shadow="md">
        <p>Medium padding, standard shadow (default)</p>
      </BaseCard>
      <BaseCard padding="lg" shadow="lg">
        <p>Large padding, prominent shadow</p>
      </BaseCard>
      <BaseCard padding="none" shadow="none">
        <p>No padding, no shadow</p>
      </BaseCard>
    </div>
  );
}

/**
 * Example 8: Responsive Dashboard Layout
 *
 * Combining multiple BaseCard features for a dashboard section
 */
export function DashboardSectionExample() {
  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Summary Card - Always Visible */}
      <BaseCard
        padding="lg"
        shadow="md"
      >
        <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-4">
          Financial Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-neutral-500">Total Balance</p>
            <p className="text-financial-lg text-neutral-900">
              ₫10,234,567
            </p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Monthly Change</p>
            <p className="text-financial-lg text-success-600">
              +₫2,500,000
            </p>
          </div>
        </div>
      </BaseCard>

      {/* Details - Collapsible on Mobile */}
      <BaseCard
        collapsibleOnMobile
        defaultCollapsed={true}
        collapsedHeader={
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent Transactions</h3>
            <span className="text-sm text-neutral-500">5 this week</span>
          </div>
        }
        padding="md"
      >
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-neutral-100">
            <span>Grocery Shopping</span>
            <span className="text-danger-600 font-semibold">-₫500,000</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-neutral-100">
            <span>Salary Deposit</span>
            <span className="text-success-600 font-semibold">+₫5,000,000</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span>Electric Bill</span>
            <span className="text-danger-600 font-semibold">-₫350,000</span>
          </div>
        </div>
      </BaseCard>
    </div>
  );
}

/**
 * Example 9: Accessible Interactive Card
 *
 * Full keyboard and screen reader support
 */
export function AccessibleCardExample() {
  return (
    <BaseCard
      hover
      onClick={() => alert("Navigating to details...")}
      padding="md"
      className="focus-within:ring-2 focus-within:ring-primary-500"
    >
      <button
        className="w-full text-left focus:outline-none"
        aria-label="View wallet details"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-neutral-900">Main Wallet</h3>
            <p className="text-sm text-neutral-500">Updated 2 minutes ago</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-primary-600">₫8,500,000</p>
            <p className="text-xs text-success-600">+2.5%</p>
          </div>
        </div>
      </button>
    </BaseCard>
  );
}

/**
 * Example 10: Complex Nested Cards
 *
 * Demonstrates using BaseCard within BaseCard
 */
export function NestedCardsExample() {
  return (
    <BaseCard padding="lg">
      <h2 className="text-xl font-bold mb-4">Portfolio Summary</h2>

      <div className="space-y-3">
        {/* Nested Card 1 */}
        <BaseCard
          padding="sm"
          shadow="sm"
          mobileOptimized
          className="bg-neutral-50"
        >
          <div className="flex justify-between items-center">
            <span className="font-medium">Stocks</span>
            <span className="text-success-600 font-semibold">+15.2%</span>
          </div>
        </BaseCard>

        {/* Nested Card 2 */}
        <BaseCard
          padding="sm"
          shadow="sm"
          mobileOptimized
          className="bg-neutral-50"
        >
          <div className="flex justify-between items-center">
            <span className="font-medium">Gold</span>
            <span className="text-success-600 font-semibold">+8.7%</span>
          </div>
        </BaseCard>

        {/* Nested Card 3 */}
        <BaseCard
          padding="sm"
          shadow="sm"
          mobileOptimized
          className="bg-neutral-50"
        >
          <div className="flex justify-between items-center">
            <span className="font-medium">Crypto</span>
            <span className="text-danger-600 font-semibold">-3.2%</span>
          </div>
        </BaseCard>
      </div>
    </BaseCard>
  );
}

/**
 * Example 11: Loading State Card
 *
 * Card with skeleton loading content
 */
export function LoadingCardExample() {
  return (
    <BaseCard padding="md">
      <div className="space-y-3 animate-pulse">
        <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
        <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
        <div className="h-4 bg-neutral-200 rounded w-5/6"></div>
      </div>
    </BaseCard>
  );
}

/**
 * Example 12: Status Cards
 *
 * Using color system for different states
 */
export function StatusCardsExample() {
  return (
    <div className="space-y-3">
      {/* Success State */}
      <BaseCard
        padding="md"
        className="border-l-4 border-success-500"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-success-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-success-700">Payment Successful</p>
            <p className="text-sm text-neutral-500">₫500,000 transferred</p>
          </div>
        </div>
      </BaseCard>

      {/* Warning State */}
      <BaseCard
        padding="md"
        className="border-l-4 border-secondary-500"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-secondary-700">Budget Alert</p>
            <p className="text-sm text-neutral-500">80% of monthly budget used</p>
          </div>
        </div>
      </BaseCard>

      {/* Error State */}
      <BaseCard
        padding="md"
        className="border-l-4 border-danger-500"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-danger-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-danger-700">Transaction Failed</p>
            <p className="text-sm text-neutral-500">Insufficient balance</p>
          </div>
        </div>
      </BaseCard>
    </div>
  );
}

/**
 * Example 13: Advanced Mobile-First Layout
 *
 * Full mobile-optimized dashboard section
 */
export function MobileFirstLayoutExample() {
  return (
    <div className="space-y-3">
      {/* Hero Card - Mobile Optimized */}
      <BaseCard
        mobileOptimized
        padding="md"
        shadow="md"
        className="bg-gradient-to-br from-primary-500 to-primary-700 text-white"
      >
        <p className="text-sm opacity-90">Total Balance</p>
        <p className="text-financial-lg mt-1">₫10,234,567</p>
        <div className="mt-4 flex gap-2">
          <button className="px-4 py-2 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors min-h-[44px]">
            Add Money
          </button>
          <button className="px-4 py-2 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors min-h-[44px]">
            Transfer
          </button>
        </div>
      </BaseCard>

      {/* Quick Actions - Collapsible on Mobile */}
      <BaseCard
        collapsibleOnMobile
        defaultCollapsed={false}
        padding="md"
        mobileOptimized
      >
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: "➕", label: "Add" },
            { icon: "💸", label: "Send" },
            { icon: "📊", label: "Stats" },
            { icon: "⚙️", label: "Settings" },
          ].map((action) => (
            <button
              key={action.label}
              className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-neutral-100 transition-colors min-h-[64px]"
            >
              <span className="text-xl">{action.icon}</span>
              <span className="text-xs text-neutral-600">{action.label}</span>
            </button>
          ))}
        </div>
      </BaseCard>

      {/* Recent Activity - Always Collapsible on Mobile */}
      <BaseCard
        collapsibleOnMobile
        defaultCollapsed={true}
        collapsedHeader={
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Recent Activity</h3>
            <span className="text-xs text-neutral-500">View all →</span>
          </div>
        }
        padding="md"
        mobileOptimized
      >
        <div className="space-y-3">
          {[
            { name: "Grocery Store", amount: "-₫500,000", time: "2h ago" },
            { name: "Salary", amount: "+₫5,000,000", time: "1d ago" },
            { name: "Electric Bill", amount: "-₫350,000", time: "2d ago" },
          ].map((tx, i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-neutral-100 last:border-0">
              <div>
                <p className="font-medium text-sm">{tx.name}</p>
                <p className="text-xs text-neutral-500">{tx.time}</p>
              </div>
              <p className={`font-semibold text-sm ${
                tx.amount.startsWith('+') ? 'text-success-600' : 'text-danger-600'
              }`}>
                {tx.amount}
              </p>
            </div>
          ))}
        </div>
      </BaseCard>
    </div>
  );
}

/**
 * Export all examples as a single demo component
 */
export function BaseCardDemo() {
  return (
    <div className="space-y-8 p-4">
      <section>
        <h2 className="text-2xl font-bold mb-4">Basic Usage</h2>
        <BasicCardExample />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Mobile Optimization</h2>
        <MobileOptimizedExample />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Collapsible Cards</h2>
        <div className="space-y-4">
          <CollapsibleCardExample />
          <MobileCollapsibleExample />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Interactive Cards</h2>
        <InteractiveCardExample />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Status Cards</h2>
        <StatusCardsExample />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Mobile-First Layout</h2>
        <MobileFirstLayoutExample />
      </section>
    </div>
  );
}
