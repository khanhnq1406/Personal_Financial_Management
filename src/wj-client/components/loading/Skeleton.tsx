"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";

type SkeletonProps = {
  className?: string;
};

// Base skeleton component
export const Skeleton = React.memo(({ className = "" }: SkeletonProps) => {
  return (
    <div
      className={cn("animate-pulse bg-neutral-200 rounded", className)}
      aria-hidden="true"
      role="status"
      aria-label="Loading..."
    />
  );
});
Skeleton.displayName = "Skeleton";

// Card skeleton for card loading states
type CardSkeletonProps = {
  className?: string;
  lines?: number;
  showHeader?: boolean;
  showAction?: boolean;
};

export const CardSkeleton = React.memo(({
  className = "",
  lines = 3,
  showHeader = true,
  showAction = true
}: CardSkeletonProps) => {
  return (
    <div
      className={cn("bg-white rounded-lg shadow-card p-4 sm:p-6 space-y-4 animate-pulse", className)}
      role="status"
      aria-label="Loading card..."
    >
      {showHeader && (
        <div className="flex items-center justify-between">
          <div className="h-6 w-32 bg-neutral-200 rounded" />
          {showAction && <div className="h-8 w-24 bg-neutral-200 rounded" />}
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-4 bg-neutral-200 rounded",
              i === lines - 1 ? "w-3/4" : "w-full"
            )}
          />
        ))}
      </div>
    </div>
  );
});
CardSkeleton.displayName = "CardSkeleton";

// Table skeleton for table loading states
type TableSkeletonProps = {
  rows?: number;
  className?: string;
  showAvatar?: boolean;
  mobile?: boolean;
};

export const TableSkeleton = React.memo(({
  rows = 5,
  className = "",
  showAvatar = true,
  mobile = false
}: TableSkeletonProps) => {
  // Mobile version: card-based layout
  if (mobile) {
    return (
      <div
        className={cn("space-y-3", className)}
        role="status"
        aria-label="Loading table..."
      >
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow-card p-4 space-y-3 animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 bg-neutral-200 rounded" />
                <div className="h-3 w-1/2 bg-neutral-200 rounded" />
              </div>
              <div className="h-6 w-20 bg-neutral-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Desktop version: row-based layout
  return (
    <div
      className={cn("space-y-3", className)}
      role="status"
      aria-label="Loading table..."
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 animate-pulse py-2">
          {showAvatar && <div className="h-12 w-12 bg-neutral-200 rounded-full" />}
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 bg-neutral-200 rounded" />
            <div className="h-3 w-1/2 bg-neutral-200 rounded" />
          </div>
          <div className="h-6 w-20 bg-neutral-200 rounded" />
        </div>
      ))}
    </div>
  );
});
TableSkeleton.displayName = "TableSkeleton";

// List skeleton for list loading states
type ListSkeletonProps = {
  items?: number;
  className?: string;
};

export const ListSkeleton = React.memo(({ items = 5, className = "" }: ListSkeletonProps) => {
  return (
    <div
      className={cn("space-y-3", className)}
      role="status"
      aria-label="Loading list..."
    >
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 animate-pulse">
          <div className="h-10 w-10 bg-neutral-200 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 bg-neutral-200 rounded" />
            <div className="h-3 w-1/3 bg-neutral-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
});
ListSkeleton.displayName = "ListSkeleton";

// Text skeleton for text content loading
type TextSkeletonProps = {
  lines?: number;
  className?: string;
};

export const TextSkeleton = React.memo(({ lines = 3, className = "" }: TextSkeletonProps) => {
  return (
    <div
      className={cn("space-y-2", className)}
      role="status"
      aria-label="Loading text..."
    >
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-4 bg-neutral-200 rounded animate-pulse",
            i === lines - 1 ? "w-2/3" : "w-full"
          )}
        />
      ))}
    </div>
  );
});
TextSkeleton.displayName = "TextSkeleton";

// Stats card skeleton for portfolio summary or dashboard statistics
type StatsCardSkeletonProps = {
  cards?: number;
  className?: string;
};

export const StatsCardSkeleton = React.memo(({ cards = 4, className = "" }: StatsCardSkeletonProps) => {
  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4",
        className
      )}
      role="status"
      aria-label="Loading statistics..."
    >
      {Array.from({ length: cards }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-lg shadow-card p-4 space-y-3 animate-pulse"
        >
          <div className="h-4 w-24 bg-neutral-200 rounded" />
          <div className="h-8 w-32 bg-neutral-200 rounded" />
          <div className="h-4 w-16 bg-neutral-200 rounded" />
        </div>
      ))}
    </div>
  );
});
StatsCardSkeleton.displayName = "StatsCardSkeleton";

// Chart skeleton for loading placeholder charts
type ChartSkeletonPropsNew = {
  className?: string;
  bars?: number;
  height?: string;
};

export const ChartSkeletonNew = React.memo(({
  className = "",
  bars = 7,
  height = "h-64"
}: ChartSkeletonPropsNew) => {
  return (
    <div
      className={cn("bg-white rounded-lg shadow-card p-4 sm:p-6", className)}
      role="status"
      aria-label="Loading chart..."
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-32 bg-neutral-200 rounded animate-pulse" />
          <div className="h-4 w-20 bg-neutral-200 rounded animate-pulse" />
        </div>

        <div className={cn("flex items-end justify-between gap-2", height)}>
          {Array.from({ length: bars }).map((_, i) => {
            const randomHeight = Math.floor(Math.random() * 60) + 30;
            return (
              <div
                key={i}
                className="flex-1 bg-neutral-200 rounded animate-pulse"
                style={{ height: `${randomHeight}%` }}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-neutral-200">
          {Array.from({ length: bars }).map((_, i) => (
            <div key={i} className="h-3 w-6 bg-neutral-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
});
ChartSkeletonNew.displayName = "ChartSkeletonNew";

// Form skeleton for loading placeholder forms
type FormSkeletonProps = {
  fields?: number;
  className?: string;
  showSubmitButton?: boolean;
};

export const FormSkeleton = React.memo(({
  fields = 4,
  className = "",
  showSubmitButton = true
}: FormSkeletonProps) => {
  return (
    <div className={cn("space-y-4", className)} role="status" aria-label="Loading form...">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2 animate-pulse">
          <div className="h-4 w-24 bg-neutral-200 rounded" />
          <div className="h-11 w-full bg-neutral-200 rounded" />
        </div>
      ))}

      {showSubmitButton && (
        <div className="pt-2">
          <div className="h-12 w-full bg-neutral-200 rounded-lg animate-pulse" />
        </div>
      )}
    </div>
  );
});
FormSkeleton.displayName = "FormSkeleton";

// Page skeleton for full-page loading states
type PageSkeletonProps = {
  className?: string;
  showHeader?: boolean;
  showSidebar?: boolean;
};

export const PageSkeleton = React.memo(({
  className = "",
  showHeader = true,
  showSidebar = false
}: PageSkeletonProps) => {
  return (
    <div className={cn("space-y-6", className)} role="status" aria-label="Loading page...">
      {showHeader && (
        <div className="flex items-center justify-between animate-pulse">
          <div className="h-8 w-48 bg-neutral-200 rounded" />
          <div className="h-10 w-32 bg-neutral-200 rounded-lg" />
        </div>
      )}

      <div className={cn("flex gap-6", showSidebar ? "flex-col lg:flex-row" : "")}>
        <div className="flex-1 space-y-6">
          <StatsCardSkeleton cards={4} />
          <CardSkeleton lines={5} />
        </div>

        {showSidebar && (
          <aside className="w-full lg:w-80 space-y-4">
            <CardSkeleton lines={3} showAction={false} />
            <CardSkeleton lines={3} showAction={false} />
          </aside>
        )}
      </div>
    </div>
  );
});
PageSkeleton.displayName = "PageSkeleton";

// Legacy skeletons - kept for backward compatibility
export const WalletListSkeleton = React.memo(({ count = 3 }: { count?: number }) => {
  return (
    <div className="px-2 py-1">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex justify-between items-center m-3">
          <div className="flex gap-3 items-center">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
});
WalletListSkeleton.displayName = "WalletListSkeleton";

export const ChartSkeleton = React.memo(() => {
  return (
    <div className="flex items-end justify-center gap-2 h-32 px-2 py-1">
      <Skeleton className="h-16 w-8" />
      <Skeleton className="h-24 w-8" />
      <Skeleton className="h-20 w-8" />
      <Skeleton className="h-28 w-8" />
      <Skeleton className="h-14 w-8" />
    </div>
  );
});
ChartSkeleton.displayName = "ChartSkeleton";

export const TotalBalanceSkeleton = React.memo(() => {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-6 w-32" />
    </div>
  );
});
TotalBalanceSkeleton.displayName = "TotalBalanceSkeleton";

export const UserSkeleton = React.memo(() => {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
});
UserSkeleton.displayName = "UserSkeleton";
