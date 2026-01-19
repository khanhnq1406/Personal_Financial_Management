import { GetFinancialReportResponse } from "@/gen/protobuf/v1/transaction";

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
 * Format amount to VND currency string
 */
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

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
 */
export const exportFinancialReportToCSV = (
  reportData: GetFinancialReportResponse | undefined,
  selectedYear: number,
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
    totalsRow.push(formatCurrency(income - expense));
  });
  totalsRow.push(formatCurrency(totalIncome - totalExpense));
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

    // Income row
    const incomeRow = ["Income"];
    let walletTotalIncome = 0;
    monthlyDataWithBalance.forEach((data) => {
      incomeRow.push(data.income > 0 ? formatCurrency(data.income) : "-");
      walletTotalIncome += data.income;
    });
    incomeRow.push(formatCurrency(walletTotalIncome));
    rows.push(incomeRow.join(","));

    // Expense row
    const expenseRow = ["Expense"];
    let walletTotalExpense = 0;
    monthlyDataWithBalance.forEach((data) => {
      expenseRow.push(data.expense > 0 ? formatCurrency(data.expense) : "-");
      walletTotalExpense += data.expense;
    });
    expenseRow.push(formatCurrency(walletTotalExpense));
    rows.push(expenseRow.join(","));

    // Balance row
    const balanceRow = ["Balance"];
    monthlyDataWithBalance.forEach((data) => {
      balanceRow.push(formatCurrency(data.balance));
    });
    balanceRow.push(formatCurrency(runningBalance));
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

  rows.push(`Total Income,"${formatCurrency(yearTotalIncome)}"`);
  rows.push(`Total Expense,"${formatCurrency(yearTotalExpense)}"`);
  rows.push(`Net Balance,"${formatCurrency(yearTotalIncome - yearTotalExpense)}"`);

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
