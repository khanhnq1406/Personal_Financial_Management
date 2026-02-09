/**
 * Example usage of the BalanceCard component
 *
 * This file demonstrates how to use the BalanceCard component in your pages.
 * You can copy these examples into your dashboard pages as needed.
 */

import { BalanceCard } from "./BalanceCard";

// Example 1: Basic usage with just balance
export function BasicBalanceCardExample() {
  return (
    <BalanceCard
      balance={12500000} // 12,500,000 VND
      currency="VND"
    />
  );
}

// Example 2: With positive change indicator
export function PositiveChangeExample() {
  return (
    <BalanceCard
      balance={12500000}
      currency="VND"
      change={{
        amount: 250000, // +250,000 VND change
        percentage: 2.04, // +2.04% change
        period: "This Month"
      }}
      lastUpdated={new Date()}
      showVerified={true}
    />
  );
}

// Example 3: With negative change indicator
export function NegativeChangeExample() {
  return (
    <BalanceCard
      balance={9750000}
      currency="VND"
      change={{
        amount: -150000, // -150,000 VND change
        percentage: -1.52, // -1.52% change
        period: "This Week"
      }}
      lastUpdated={new Date()}
      showVerified={true}
    />
  );
}

// Example 4: USD currency
export function USDBalanceExample() {
  return (
    <BalanceCard
      balance={524500} // $5,245.00 (stored as cents)
      currency="USD"
      change={{
        amount: 10500, // +$105.00
        percentage: 2.04,
        period: "This Month"
      }}
      lastUpdated={new Date()}
    />
  );
}

// Example 5: Without verified badge
export function NoVerifiedBadgeExample() {
  return (
    <BalanceCard
      balance={12500000}
      currency="VND"
      showVerified={false}
    />
  );
}

// Example 6: In a dashboard grid layout
export function DashboardLayoutExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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

      {/* Other cards or components */}
      <div className="bg-white rounded-lg shadow-card p-6">
        {/* Other content */}
      </div>
    </div>
  );
}

// Example 7: Full-width on mobile, half-width on desktop
export function ResponsiveLayoutExample() {
  return (
    <div className="w-full lg:w-1/2">
      <BalanceCard
        balance={12500000}
        currency="VND"
        change={{
          amount: 250000,
          percentage: 2.04,
          period: "This Month"
        }}
        lastUpdated={new Date()}
        showVerified={true}
      />
    </div>
  );
}

// Example 8: Real-world integration with wallet data
export function RealWorldExample() {
  // In a real component, you'd fetch this data from your API
  const wallets = [
    { id: 1, balance: 5000000, currency: "VND" },
    { id: 2, balance: 7500000, currency: "VND" },
  ];

  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);

  // Calculate change (you'd get this from your analytics)
  const lastMonthBalance = 11500000;
  const changeAmount = totalBalance - lastMonthBalance;
  const changePercentage = (changeAmount / lastMonthBalance) * 100;

  return (
    <BalanceCard
      balance={totalBalance}
      currency="VND"
      change={{
        amount: changeAmount,
        percentage: changePercentage,
        period: "This Month"
      }}
      lastUpdated={new Date()}
      showVerified={true}
    />
  );
}
