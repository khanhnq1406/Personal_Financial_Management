import { GetFinancialReportResponse } from "@/gen/protobuf/v1/transaction";
import { formatCurrency as formatCurrencyUtil } from "@/utils/currency-formatter";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/**
 * Escape CSV value by wrapping in quotes if it contains commas, quotes, or newlines
 */
const escapeCSV = (value: string): string => {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

/**
 * Generate and download financial report as CSV file
 *
 * @param reportData - Financial report data from API
 * @param selectedYear - Year for the report
 * @param currency - User's preferred currency code (e.g., "VND", "USD")
 */
export const exportFinancialReportToCSV = (
  reportData: GetFinancialReportResponse | undefined,
  selectedYear: number,
  currency: string = "VND",
): void => {
  if (!reportData?.walletData || reportData.walletData.length === 0) {
    throw new Error("No data available to export for the selected period.");
  }

  const rows: string[] = [];

  // Add title row
  rows.push(`Financial Report - ${selectedYear}`);
  rows.push("");

  // Add summary section
  rows.push("Summary," + MONTHS.map((m) => `"${m}"`).join(",") + ",Total");

  // Add totals row
  const totalsRow = ["Total"];
  let totalIncome = 0;
  let totalExpense = 0;

  reportData.totals.forEach((monthData) => {
    const income = monthData.income?.amount ?? 0;
    const expense = monthData.expense?.amount ?? 0;
    totalIncome += income;
    totalExpense += expense;
    totalsRow.push(formatCurrencyUtil(income - expense, currency));
  });
  totalsRow.push(formatCurrencyUtil(totalIncome - totalExpense, currency));
  rows.push(totalsRow.join(","));

  rows.push("");

  // Add detailed section for each wallet
  rows.push("Wallet Details");

  reportData.walletData.forEach((wallet) => {
    rows.push("");
    rows.push(`Wallet: "${escapeCSV(wallet.walletName)}"`);

    // Header row for this wallet
    rows.push("Category," + MONTHS.map((m) => `"${m}"`).join(",") + ",Total");

    // Calculate running balance
    let runningBalance = 0;
    const monthlyDataWithBalance = wallet.monthlyData.map((monthData) => {
      const income = monthData.income?.amount ?? 0;
      const expense = monthData.expense?.amount ?? 0;
      runningBalance += income - expense;
      return {
        income,
        expense,
        balance: runningBalance,
      };
    });

    // Combine multiple iterations into one loop (js-combine-iterations optimization)
    const incomeRow = ["Income"];
    const expenseRow = ["Expense"];
    const balanceRow = ["Balance"];
    let walletTotalIncome = 0;
    let walletTotalExpense = 0;

    monthlyDataWithBalance.forEach((data) => {
      // Process income row
      incomeRow.push(data.income > 0 ? formatCurrencyUtil(data.income, currency) : "-");
      walletTotalIncome += data.income;

      // Process expense row
      expenseRow.push(data.expense > 0 ? formatCurrencyUtil(data.expense, currency) : "-");
      walletTotalExpense += data.expense;

      // Process balance row
      balanceRow.push(formatCurrencyUtil(data.balance, currency));
    });

    incomeRow.push(formatCurrencyUtil(walletTotalIncome, currency));
    rows.push(incomeRow.join(","));

    expenseRow.push(formatCurrencyUtil(walletTotalExpense, currency));
    rows.push(expenseRow.join(","));

    balanceRow.push(formatCurrencyUtil(runningBalance, currency));
    rows.push(balanceRow.join(","));
  });

  // Add yearly summary at the end
  rows.push("");
  rows.push("Yearly Summary");
  rows.push("Metric,Total");

  let yearTotalIncome = 0;
  let yearTotalExpense = 0;

  reportData.walletData.forEach((wallet) => {
    wallet.monthlyData.forEach((monthData) => {
      yearTotalIncome += monthData.income?.amount ?? 0;
      yearTotalExpense += monthData.expense?.amount ?? 0;
    });
  });

  rows.push(`Total Income,"${formatCurrencyUtil(yearTotalIncome, currency)}"`);
  rows.push(`Total Expense,"${formatCurrencyUtil(yearTotalExpense, currency)}"`);
  rows.push(`Net Balance,"${formatCurrencyUtil(yearTotalIncome - yearTotalExpense, currency)}"`);

  // Convert rows to CSV string
  const csvContent = rows.join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  const filename = `financial_report_${selectedYear}_${new Date().toISOString().split("T")[0]}.csv`;

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
