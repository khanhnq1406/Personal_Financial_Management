"use client";

import { memo } from "react";

interface MonthlyData {
  income: number;
  expense: number;
  balance: number;
}

interface WalletData {
  id: number;
  walletName: string;
  balance?: { amount: number };
  isExpanded: boolean;
  monthlyData: MonthlyData[];
}

interface TableData {
  income: number;
  expense: number;
  balance: number;
}

interface ExpandableTableProps {
  months: string[];
  wallets: WalletData[];
  totals: TableData[];
  onToggleWallet: (walletId: number) => void;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const ExpandableTable = memo(function ExpandableTable({
  months,
  wallets,
  totals,
  onToggleWallet,
}: ExpandableTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">
              Wallet
            </th>
            {months.map((month) => (
              <th
                key={month}
                className="text-center py-3 px-2 font-semibold text-sm text-gray-700 min-w-[80px]"
              >
                {month}
              </th>
            ))}
            <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {wallets.map((wallet) => (
            <>
              <tr
                key={wallet.id}
                className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                onClick={() => onToggleWallet(wallet.id)}
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWallet(wallet.id);
                      }}
                      className="w-4 h-4 flex items-center justify-center"
                      aria-label={wallet.isExpanded ? "Collapse" : "Expand"}
                    >
                      {wallet.isExpanded ? (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M7.41 15.41L12 10.83L16.59 15.41L18 14L12 8L6 14L7.41 15.41Z"
                            fill="#333333"
                          />
                        </svg>
                      ) : (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M7.41 8.59L12 13.17L16.59 8.59L18 10L12 16L6 10L7.41 8.59Z"
                            fill="#333333"
                          />
                        </svg>
                      )}
                    </button>
                    <span className="font-medium text-sm">
                      {wallet.walletName}
                    </span>
                  </div>
                </td>
                {wallet.monthlyData.map((data, index) => (
                  <td
                    key={index}
                    className="text-center py-3 px-2 text-sm text-gray-600"
                  >
                    {data.balance}
                  </td>
                ))}
                <td className="text-center py-3 px-4 font-semibold text-sm">
                  {formatCurrency(wallet.balance?.amount ?? 0)}
                </td>
              </tr>

              {wallet.isExpanded && (
                <tr className="bg-gray-50">
                  <td className="py-2 px-4">
                    <div className="pl-6 text-xs text-gray-500">Income</div>
                  </td>
                  {wallet.monthlyData.map((data, index) => (
                    <td
                      key={`income-${index}`}
                      className="text-center py-2 px-2 text-xs text-green-600"
                    >
                      {data.income > 0 ? formatCurrency(data.income) : "-"}
                    </td>
                  ))}
                  <td className="text-center py-2 px-4 text-xs font-semibold text-green-600">
                    {formatCurrency(
                      wallet.monthlyData.reduce((sum, m) => sum + m.income, 0),
                    )}
                  </td>
                </tr>
              )}
              {wallet.isExpanded && (
                <tr className="bg-gray-50 border-b border-gray-200">
                  <td className="py-2 px-4">
                    <div className="pl-6 text-xs text-gray-500">Expense</div>
                  </td>
                  {wallet.monthlyData.map((data, index) => (
                    <td
                      key={`expense-${index}`}
                      className="text-center py-2 px-2 text-xs text-red-600"
                    >
                      {data.expense > 0 ? formatCurrency(data.expense) : "-"}
                    </td>
                  ))}
                  <td className="text-center py-2 px-4 text-xs font-semibold text-red-600">
                    {formatCurrency(
                      wallet.monthlyData.reduce((sum, m) => sum + m.expense, 0),
                    )}
                  </td>
                </tr>
              )}
            </>
          ))}

          {/* Totals Row */}
          <tr className="bg-gray-100 font-semibold">
            <td className="py-3 px-4 text-sm">Total</td>
            {months.map((_, index) => (
              <td
                key={`total-${index}`}
                className="text-center py-3 px-2 text-sm"
              >
                {formatCurrency(totals[index]?.balance ?? 0)}
              </td>
            ))}
            <td className="text-center py-3 px-4 text-sm">
              {formatCurrency(
                wallets.reduce((sum, w) => sum + (w.balance?.amount ?? 0), 0),
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
});
