import { ButtonType } from "@/app/constants";
import { cn } from "@/lib/utils/cn";
import React from "react";

type PropType = {
  type: string;
  onClick?: React.MouseEventHandler;
  children?: React.ReactNode;
  src?: string | undefined;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
  "aria-pressed"?: boolean;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
};

// Hoist SVG content outside component to avoid recreating on each render
const LoadingSpinner = ({ className }: { className?: string }) => (
  <svg
    className={cn("animate-spin h-5 w-5", className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

export const Button = React.memo(function Button({
  type,
  src,
  onClick,
  children,
  loading = false,
  disabled = false,
  className = "",
  "aria-label": ariaLabel,
  "aria-pressed": ariaPressed,
  fullWidth = true,
  size = "md",
}: PropType) {
  // Size variants
  const sizeClasses = {
    sm: "py-2 px-4 text-sm min-h-[44px] sm:min-h-[40px]",
    md: "py-2.5 sm:py-3 px-6 text-base min-h-[44px] sm:min-h-[48px]",
    lg: "py-3 sm:py-4 px-8 text-lg min-h-[48px] sm:min-h-[56px]",
  };

  // Base classes for all buttons
  const baseClasses = cn(
    "font-semibold rounded-lg cursor-pointer",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
    "flex items-center justify-center gap-2 sm:gap-3",
    "transition-all duration-200",
    sizeClasses[size]
  );

  switch (type) {
    case ButtonType.IMG:
      return (
        <button
          className={cn(
            "!p-2.5 sm:!p-2 !min-h-[44px] sm:!min-h-[48px] !min-w-[44px] sm:!min-w-[48px] !w-auto",
            "bg-transparent",
            // Light mode hover
            "hover:bg-neutral-100",
            // Dark mode hover
            "dark:hover:bg-dark-surface-hover",
            "rounded-full cursor-pointer",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
            "dark:focus-visible:ring-offset-dark-background",
            "transition-all duration-200",
            className
          )}
          onClick={onClick}
          aria-label={ariaLabel}
          aria-pressed={ariaPressed}
          disabled={loading || disabled}
        >
          {loading ? (
            <LoadingSpinner className="text-primary-600" />
          ) : (
            <img src={src} alt="" className="w-5" />
          )}
        </button>
      );

    case ButtonType.PRIMARY:
      return (
        <button
          className={cn(
            baseClasses,
            "bg-primary-600 text-white",
            "hover:bg-primary-700 hover:shadow-md",
            "active:bg-primary-800 active:scale-[0.98]",
            fullWidth ? "w-full" : "w-auto",
            className
          )}
          onClick={onClick}
          disabled={loading || disabled}
          aria-label={ariaLabel}
        >
          {loading && <LoadingSpinner className="text-white" />}
          {children}
        </button>
      );

    case ButtonType.SECONDARY:
      return (
        <button
          className={cn(
            baseClasses,
            // Light mode
            "bg-white text-primary-600 border-2 border-primary-600",
            "hover:bg-neutral-50 hover:shadow-card",
            "active:bg-neutral-100",
            // Dark mode
            "dark:bg-dark-surface dark:text-primary-500 dark:border-primary-500",
            "dark:hover:bg-dark-surface-hover dark:hover:shadow-dark-card",
            "dark:active:bg-dark-surface-active",
            "active:scale-[0.98]",
            fullWidth ? "w-full" : "w-auto",
            className
          )}
          onClick={onClick}
          disabled={loading || disabled}
          aria-label={ariaLabel}
        >
          {loading && <LoadingSpinner className="text-primary-600 dark:text-primary-500" />}
          {children}
        </button>
      );

    default:
      return null;
  }
});
