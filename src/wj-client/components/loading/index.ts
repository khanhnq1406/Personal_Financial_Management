/**
 * Loading Components Index
 *
 * Convenient exports for all loading and skeleton components.
 *
 * @example
 * import { LoadingSpinner, CardSkeleton, TableSkeleton } from "@/components/loading";
 */

// Basic loading components
export { LoadingSpinner } from "./LoadingSpinner";
export { FullPageLoading } from "./FullPageLoading";

// Skeleton components
export {
  Skeleton,
  CardSkeleton,
  TableSkeleton,
  ListSkeleton,
  TextSkeleton,
  StatsCardSkeleton,
  ChartSkeleton,
  FormSkeleton,
  PageSkeleton,
  ButtonSkeleton,
  PortfolioSkeleton,
  TransactionSkeleton,
  WalletCardSkeleton,
  ModalSkeleton,
  AvatarSkeleton,
  // Legacy skeletons (backward compatibility)
  WalletListSkeleton,
  TotalBalanceSkeleton,
  UserSkeleton,
} from "./Skeleton";

// Re-export types for TypeScript users
export type { SkeletonProps } from "./Skeleton";
