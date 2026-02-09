"use client";

/**
 * Legacy icon path constants for backwards compatibility
 * Maps old icon names to their public SVG file paths
 *
 * @deprecated Import specific icon components from @/components/icons instead
 * This file is provided for temporary backwards compatibility during migration.
 *
 * @example
 * // Old way (deprecated)
 * <Image src={ICON_PATHS.wallet} alt="Wallet" width={32} height={32} />
 *
 * // New way
 * import { WalletIcon } from "@/components/icons";
 * <WalletIcon size="lg" ariaLabel="Wallet" />
 */

export const ICON_PATHS = {
  // Navigation icons (in public root)
  home: "/home.svg",
  dashboard: "/dashboard.svg",
  "wallet-white": "/wallet-white.svg",
  portfolio: "/portfolio.svg",
  budget: "/budget.svg",
  report: "/report.svg",

  // Action icons (in public/resources/icons/)
  plus: "/resources/icons/plus.svg",
  edit: "/resources/icons/edit.svg",
  editing: "/resources/icons/editing.svg",
  delete: "/resources/icons/delete.svg",
  remove: "/resources/icons/remove.svg",
  close: "/resources/icons/close.svg",
  logout: "/resources/icons/logout.svg",

  // Finance icons (in public/resources/icons/)
  income: "/resources/icons/income.svg",
  expense: "/resources/icons/expense.svg",
  savings: "/resources/icons/savings.svg",
  transfer: "/resources/icons/transfer.svg",
  percent: "/resources/icons/percent.svg",
  category: "/resources/icons/category.svg",

  // UI icons (in public/resources/icons/)
  "chevron-left": "/resources/icons/chevron-left.svg",
  "chevron-right": "/resources/icons/chevron-right.svg",
  down: "/resources/icons/down.svg",
  refresh: "/resources/icons/refresh.svg",
  hide: "/resources/icons/hide.svg",
  unhide: "/resources/icons/unhide.svg",
  user: "/resources/icons/user.svg",

  // Icons in public root that also exist in resources/icons/
  // These are used in navigation contexts and map to root files
  transaction: "/transaction.svg",
  wallet: "/resources/icons/wallet.svg",
} as const;

/**
 * Type for legacy icon path keys
 * @deprecated Use specific icon components instead
 */
export type IconPath = keyof typeof ICON_PATHS;

/**
 * Legacy icon component wrapper for backwards compatibility
 * @deprecated Use specific icon components from @/components/icons instead
 *
 * @example
 * // Old way (deprecated)
 * <LegacyIcon name="wallet" className="w-6 h-6" />
 *
 * // New way
 * import { WalletIcon } from "@/components/icons";
 * <WalletIcon size="lg" />
 */
export function LegacyIcon({
  name,
  className = "w-6 h-6",
  alt,
}: {
  name: IconPath;
  className?: string;
  alt?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={ICON_PATHS[name]}
      alt={alt || name}
      className={className}
      decoding="async"
    />
  );
}
