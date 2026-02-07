"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Toast Component
 *
 * A notification toast component for displaying messages.
 * Part of Phase 4 modular components.
 *
 * Features:
 * - Auto-dismiss after timeout
 * - Multiple variants (success, error, warning, info)
 * - Animated entrance/exit
 * - Stacked notifications
 * - Dark mode support
 */

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastProps {
  /** Toast message */
  message: string;

  /** Toast variant */
  variant?: ToastVariant;

  /** Duration in milliseconds (0 = no auto-dismiss) */
  duration?: number;

  /** Unique ID for the toast */
  id?: string;

  /** On close callback */
  onClose?: () => void;

  /** Action button */
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function Toast({
  message,
  variant = "info",
  duration = 5000,
  onClose,
  action,
}: ToastProps) {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, 300); // Match animation duration
  };

  if (!visible) return null;

  const variantStyles = {
    success: "bg-green-500 dark:bg-green-600 text-white",
    error: "bg-red-500 dark:bg-red-600 text-white",
    warning: "bg-yellow-500 dark:bg-yellow-600 text-white",
    info: "bg-primary-500 dark:bg-primary-600 text-white",
  };

  const variantIcons = {
    success: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  const toastContent = (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg pointer-events-auto transition-all duration-300 ${
        exiting ? "opacity-0 translate-x-full" : "opacity-100 translate-x-0"
      } ${variantStyles[variant]}`}
    >
      <div className="flex-shrink-0">{variantIcons[variant]}</div>

      <p className="flex-1 text-sm font-medium">{message}</p>

      {action && (
        <button
          onClick={action.onClick}
          className="text-sm font-semibold underline hover:no-underline"
        >
          {action.label}
        </button>
      )}

      <button
        onClick={handleClose}
        className="flex-shrink-0 p-1 hover:opacity-75 transition-opacity"
        aria-label="Close"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );

  // Render in portal at the top-right of the viewport
  if (typeof document !== "undefined") {
    return createPortal(
      <div className="fixed top-4 right-4 z-50 max-w-sm w-full">{toastContent}</div>,
      document.body,
    );
  }

  return null;
}

/**
 * Toast Container for managing multiple toasts
 */
export interface ToastContainerProps {
  toasts: Array<{ id: string; message: string; variant?: ToastVariant }>;
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          variant={toast.variant}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>,
    document.body,
  );
}

export default Toast;
