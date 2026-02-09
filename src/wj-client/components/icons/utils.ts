import { type IconSize } from "./Icon";

/**
 * Get icon size for button based on button size
 */
export function getIconSizeForButton(buttonSize: "sm" | "md" | "lg"): IconSize {
  const sizeMap: Record<typeof buttonSize, IconSize> = {
    sm: "sm",
    md: "md",
    lg: "lg",
  };
  return sizeMap[buttonSize];
}

/**
 * Get color class for finance type
 */
export function getFinanceColor(type: "income" | "expense" | "transfer"): string {
  const colorMap = {
    income: "text-success-600 dark:text-success-500",
    expense: "text-danger-600 dark:text-danger-500",
    transfer: "text-primary-600 dark:text-primary-500",
  };
  return colorMap[type];
}

/**
 * Map transaction type to icon component
 */
export function getTransactionIcon(type: "income" | "expense" | "transfer") {
  // Import dynamically to avoid circular dependencies
  const { IncomeIcon, ExpenseIcon, TransferIcon } = require("./finance");
  const iconMap = {
    income: IncomeIcon,
    expense: ExpenseIcon,
    transfer: TransferIcon,
  };
  return iconMap[type];
}
