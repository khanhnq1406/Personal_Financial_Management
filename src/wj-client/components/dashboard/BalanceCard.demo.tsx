/**
 * BalanceCard Demo Page
 *
 * This is a demo page to visually test the BalanceCard component.
 * To use it, create a route at app/demo/balance-card/page.tsx:
 *
 * ```tsx
 * export { default } from "@/components/dashboard/BalanceCard.demo";
 * ```
 */

"use client";

import { BalanceCard } from "./BalanceCard";

export default function BalanceCardDemo() {
  return (
    <div className="min-h-screen bg-neutral-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-card p-6">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            BalanceCard Component Demo
          </h1>
          <p className="text-neutral-600">
            Visual showcase of the BalanceCard component with different configurations
          </p>
        </div>

        {/* Demo Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Example 1: Basic with positive change */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-neutral-800">
              1. With Positive Change
            </h3>
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

          {/* Example 2: With negative change */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-neutral-800">
              2. With Negative Change
            </h3>
            <BalanceCard
              balance={9750000}
              currency="VND"
              change={{
                amount: -150000,
                percentage: -1.52,
                period: "This Week"
              }}
              lastUpdated={new Date()}
              showVerified={true}
            />
          </div>

          {/* Example 3: Basic without change */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-neutral-800">
              3. Basic (No Change Indicator)
            </h3>
            <BalanceCard
              balance={12500000}
              currency="VND"
            />
          </div>

          {/* Example 4: USD currency */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-neutral-800">
              4. USD Currency
            </h3>
            <BalanceCard
              balance={524500} // $5,245.00
              currency="USD"
              change={{
                amount: 10500,
                percentage: 2.04,
                period: "This Month"
              }}
              lastUpdated={new Date()}
            />
          </div>

          {/* Example 5: Large balance */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-neutral-800">
              5. Large Balance
            </h3>
            <BalanceCard
              balance={156750000}
              currency="VND"
              change={{
                amount: 8750000,
                percentage: 5.91,
                period: "Last 3 Months"
              }}
              lastUpdated={new Date(Date.now() - 3600000)} // 1 hour ago
            />
          </div>

          {/* Example 6: Without verified badge */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-neutral-800">
              6. Without Verified Badge
            </h3>
            <BalanceCard
              balance={12500000}
              currency="VND"
              change={{
                amount: 250000,
                percentage: 2.04,
                period: "This Month"
              }}
              lastUpdated={new Date()}
              showVerified={false}
            />
          </div>

          {/* Example 7: EUR currency */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-neutral-800">
              7. EUR Currency
            </h3>
            <BalanceCard
              balance={435250} // €4,352.50
              currency="EUR"
              change={{
                amount: -8500,
                percentage: -1.91,
                period: "This Week"
              }}
              lastUpdated={new Date(Date.now() - 7200000)} // 2 hours ago
            />
          </div>

          {/* Example 8: Small balance */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-neutral-800">
              8. Small Balance
            </h3>
            <BalanceCard
              balance={285000}
              currency="VND"
              change={{
                amount: -15000,
                percentage: -5.0,
                period: "Today"
              }}
              lastUpdated={new Date(Date.now() - 900000)} // 15 minutes ago
            />
          </div>
        </div>

        {/* Full-width example */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-neutral-800">
            9. Full-Width Layout
          </h3>
          <BalanceCard
            balance={45250000}
            currency="VND"
            change={{
              amount: 1250000,
              percentage: 2.84,
              period: "Year to Date"
            }}
            lastUpdated={new Date(Date.now() - 300000)} // 5 minutes ago
            showVerified={true}
          />
        </div>

        {/* Features List */}
        <div className="bg-white rounded-lg shadow-card p-6 space-y-4">
          <h2 className="text-2xl font-bold text-neutral-900">Component Features</h2>
          <ul className="space-y-2 text-neutral-700">
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span><strong>Gradient Background:</strong> Professional blue gradient (primary-600 to primary-700)</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span><strong>Privacy Toggle:</strong> Click the eye icon to hide/show balance</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span><strong>Change Indicator:</strong> Shows percentage with color-coded arrows (green up, red down)</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span><strong>Last Updated:</strong> Displays "Updated X ago" using date-fns</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span><strong>Verified Badge:</strong> Trust signal for verified data sources</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span><strong>Multi-Currency:</strong> Supports VND, USD, EUR, and all currencies in formatCurrency</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span><strong>Responsive:</strong> Optimized for mobile and desktop with proper spacing</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span><strong>Accessible:</strong> WCAG compliant with 44px touch targets and ARIA labels</span>
            </li>
          </ul>
        </div>

        {/* Technical Details */}
        <div className="bg-white rounded-lg shadow-card p-6 space-y-4">
          <h2 className="text-2xl font-bold text-neutral-900">Technical Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold text-neutral-700">Performance</h4>
              <ul className="space-y-1 text-neutral-600">
                <li>• Memoized with React.memo</li>
                <li>• Local state for visibility toggle</li>
                <li>• No unnecessary re-renders</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-neutral-700">Dependencies</h4>
              <ul className="space-y-1 text-neutral-600">
                <li>• date-fns: Date formatting</li>
                <li>• @/lib/utils/cn: Class name utility</li>
                <li>• @/utils/currency-formatter: Currency formatting</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-neutral-700">Design System</h4>
              <ul className="space-y-1 text-neutral-600">
                <li>• Primary colors (blue gradient)</li>
                <li>• Success green for positive changes</li>
                <li>• Danger red for negative changes</li>
                <li>• Shadow-card elevation</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-neutral-700">Accessibility</h4>
              <ul className="space-y-1 text-neutral-600">
                <li>• 44x44px minimum touch targets</li>
                <li>• ARIA labels for screen readers</li>
                <li>• Keyboard accessible</li>
                <li>• WCAG AAA contrast ratio</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
