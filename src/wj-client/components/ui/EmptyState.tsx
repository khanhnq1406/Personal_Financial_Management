"use client";

import React from "react";

/**
 * EmptyState Component
 *
 * A component for displaying empty states (no data, no results, etc.).
 * Part of Phase 4 modular components.
 *
 * Features:
 * - Icon/illustration support
 * - Title and description
 * - Optional action button
 * - Responsive design
 * - Dark mode support
 */

export interface EmptyStateProps {
  /** Title of the empty state */
  title: string;

  /** Description text */
  description?: string;

  /** Icon or illustration */
  icon?: React.ReactNode;

  /** Action button label */
  actionLabel?: string;

  /** Action button click handler */
  onAction?: () => void;

  /** Size variant */
  size?: "sm" | "md" | "lg";

  /** CSS class name */
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  size = "md",
  className = "",
}: EmptyStateProps) {
  const sizeStyles = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  };

  const iconSizeStyles = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 ${className}`}>
      {icon && (
        <div className={`rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 ${sizeStyles[size]}`}>
          <div className={iconSizeStyles[size]}>{icon}</div>
        </div>
      )}

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>

      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-4">{description}</p>
      )}

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-bg text-white rounded-md hover:opacity-90 transition-opacity"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/**
 * Preset empty states for common scenarios
 */
export const EmptyStates = {
  NoTransactions: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      title="No transactions yet"
      description="Start by adding your first transaction to track your finances."
      icon={
        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      }
      {...props}
    />
  ),

  NoWallets: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      title="No wallets found"
      description="Create a wallet to start tracking your balance and transactions."
      icon={
        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      }
      {...props}
    />
  ),

  NoInvestments: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      title="No investments yet"
      description="Add investments to track your portfolio performance over time."
      icon={
        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      }
      {...props}
    />
  ),

  NoResults: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      title="No results found"
      description="Try adjusting your filters or search terms."
      icon={
        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      }
      {...props}
    />
  ),

  NoBudgets: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      title="No budgets set"
      description="Create budgets to manage your spending by category."
      icon={
        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      }
      {...props}
    />
  ),
};

export default EmptyState;
