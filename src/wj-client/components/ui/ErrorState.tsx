"use client";

import React from "react";

/**
 * ErrorState Component
 *
 * A component for displaying error states.
 * Part of Phase 4 modular components.
 *
 * Features:
 * - Error message display
 * - Optional retry action
 * - Different error types
 * - Responsive design
 * - Dark mode support
 */

export type ErrorType = "network" | "server" | "permission" | "not-found" | "generic";

export interface ErrorStateProps {
  /** Error title */
  title?: string;

  /** Error description */
  message?: string;

  /** Error type for preset styling */
  type?: ErrorType;

  /** Retry button label */
  retryLabel?: string;

  /** Retry action */
  onRetry?: () => void;

  /** Additional actions */
  actions?: React.ReactNode;

  /** CSS class name */
  className?: string;
}

export function ErrorState({
  title,
  message,
  type = "generic",
  retryLabel = "Try Again",
  onRetry,
  actions,
  className = "",
}: ErrorStateProps) {
  const errorConfig = {
    network: {
      title: title || "Connection Error",
      message: message || "Unable to connect. Please check your internet connection.",
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
        </svg>
      ),
    },
    server: {
      title: title || "Server Error",
      message: message || "Something went wrong on our end. Please try again later.",
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
        </svg>
      ),
    },
    permission: {
      title: title || "Access Denied",
      message: message || "You don't have permission to access this resource.",
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
    "not-found": {
      title: title || "Not Found",
      message: message || "The requested resource could not be found.",
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    generic: {
      title: title || "Something Went Wrong",
      message: message || "An unexpected error occurred. Please try again.",
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  };

  const config = errorConfig[type];

  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 ${className}`}>
      <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4 text-red-600 dark:text-red-400">
        {config.icon}
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{config.title}</h3>

      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-4">{config.message}</p>

      <div className="flex gap-2">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-bg text-white rounded-md hover:opacity-90 transition-opacity"
          >
            {retryLabel}
          </button>
        )}

        {actions}
      </div>
    </div>
  );
}

/**
 * Preset error states for common scenarios
 */
export const ErrorStates = {
  NetworkError: (props: Partial<ErrorStateProps>) => <ErrorState type="network" {...props} />,

  ServerError: (props: Partial<ErrorStateProps>) => <ErrorState type="server" {...props} />,

  PermissionError: (props: Partial<ErrorStateProps>) => <ErrorState type="permission" {...props} />,

  NotFoundError: (props: Partial<ErrorStateProps>) => <ErrorState type="not-found" {...props} />,

  GenericError: (props: Partial<ErrorStateProps>) => <ErrorState type="generic" {...props} />,
};

export default ErrorState;
