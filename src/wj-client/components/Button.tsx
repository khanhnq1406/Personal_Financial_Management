import { ButtonType } from "@/app/constants";
import { cn } from "@/lib/utils/cn";
import React from "react";

type PropType = {
  type?: string;
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
  // Enhanced props
  variant?: "primary" | "secondary" | "ghost" | "link" | "danger" | "success";
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  iconOnly?: boolean;
  success?: boolean;
  href?: string;
  target?: string;
  download?: boolean;
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

// Success checkmark icon
const SuccessIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
      clipRule="evenodd"
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
  variant,
  leftIcon,
  rightIcon,
  iconOnly,
  success = false,
  href,
  target,
  download,
}: PropType) {
  // Determine button variant from type or variant prop
  const buttonVariant =
    variant ||
    (type === ButtonType.PRIMARY
      ? "primary"
      : type === ButtonType.SECONDARY
        ? "secondary"
        : "primary");

  // Size variants
  const sizeClasses = {
    sm: iconOnly
      ? "p-2 min-h-[36px] min-w-[36px]"
      : "py-2 px-3 sm:px-4 text-sm min-h-[44px] sm:min-h-[40px]",
    md: iconOnly
      ? "p-2.5 min-h-[40px] min-w-[40px]"
      : "py-2.5 sm:py-3 px-4 sm:px-6 text-base min-h-[44px] sm:min-h-[48px]",
    lg: iconOnly
      ? "p-3 min-h-[48px] min-w-[48px]"
      : "py-3 sm:py-4 px-6 sm:px-8 text-lg min-h-[48px] sm:min-h-[56px]",
  };

  // Base classes for all buttons
  const baseClasses = cn(
    "font-semibold rounded-lg cursor-pointer",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
    "flex items-center justify-center gap-2 sm:gap-3",
    "transition-all duration-200 ease-in-out",
    "active:scale-[0.98]",
    sizeClasses[size],
  );

  // Variant-specific classes (using semantic design system colors)
  const variantClasses = {
    primary: cn(
      "bg-primary-600 text-white",
      "hover:bg-primary-700 hover:shadow-md",
      "active:bg-primary-800",
      "dark:bg-primary-600 dark:hover:bg-primary-700 dark:active:bg-primary-800",
    ),
    secondary: cn(
      "bg-white text-primary-600 border-2 border-primary-600",
      "hover:bg-primary-50 hover:shadow-md",
      "active:bg-primary-100",
      "dark:bg-dark-surface dark:text-primary-500 dark:border-primary-500",
      "dark:hover:bg-dark-surface-hover dark:active:bg-dark-surface-active",
    ),
    ghost: cn(
      "bg-transparent text-neutral-700 dark:text-neutral-300",
      "hover:bg-neutral-100 dark:hover:bg-dark-surface-hover",
      "active:bg-neutral-200 dark:active:bg-dark-surface-active",
    ),
    link: cn(
      "bg-transparent text-primary-600 dark:text-primary-500",
      "hover:underline",
      "hover:bg-transparent",
      "p-0 min-h-0",
    ),
    danger: cn(
      "bg-danger-600 text-white",
      "hover:bg-danger-700 hover:shadow-md",
      "active:bg-danger-800",
      "dark:bg-danger-600 dark:hover:bg-danger-700 dark:active:bg-danger-800",
    ),
    success: cn(
      "bg-success-600 text-white",
      "hover:bg-success-700 hover:shadow-md",
      "active:bg-success-800",
      "dark:bg-success-600 dark:hover:bg-success-700 dark:active:bg-success-800",
    ),
  };

  // Content to render
  const renderContent = () => {
    if (loading) {
      return (
        <>
          <LoadingSpinner className="text-current" />
          {!iconOnly && children}
        </>
      );
    }

    if (success && !loading) {
      return (
        <>
          <SuccessIcon className="w-5 h-5" />
          {!iconOnly && (children || "Success")}
        </>
      );
    }

    return (
      <>
        {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        {!iconOnly && children}
        {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </>
    );
  };

  // Common props
  const commonProps = {
    className: cn(
      baseClasses,
      variantClasses[buttonVariant],
      fullWidth && !iconOnly && buttonVariant !== "link" ? "w-full" : "w-auto",
      className,
    ),
    onClick: href ? undefined : onClick,
    disabled: loading || disabled || success,
    "aria-label": ariaLabel,
    "aria-pressed": ariaPressed,
    "aria-busy": loading,
  };

  // Image button (legacy type)
  if (type === ButtonType.IMG) {
    return (
      <button
        className={cn(
          "!p-2.5 sm:!p-2 !min-h-[44px] sm:!min-h-[48px] !min-w-[44px] sm:!min-w-[48px] !w-auto",
          "bg-transparent",
          "hover:bg-neutral-100 dark:hover:bg-dark-surface-hover",
          "rounded-full",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
          "transition-all duration-200 ease-in-out",
          "active:scale-[0.95]",
          "flex items-center justify-center",
          className,
        )}
        onClick={onClick}
        aria-label={ariaLabel}
        aria-pressed={ariaPressed}
        disabled={loading || disabled}
        aria-busy={loading}
      >
        {loading ? (
          <LoadingSpinner className="text-primary-600" />
        ) : src ? (
          <img src={src} alt="" className="w-5 h-5" />
        ) : null}
      </button>
    );
  }

  // Link variant renders as anchor tag
  if (buttonVariant === "link" && href) {
    return (
      <a
        href={href}
        target={target}
        download={download}
        className={commonProps.className}
        aria-label={ariaLabel}
      >
        {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </a>
    );
  }

  // Regular button
  if (href) {
    return (
      <a href={href} target={target} download={download} {...commonProps}>
        {renderContent()}
      </a>
    );
  }

  return <button {...commonProps}>{renderContent()}</button>;
});
