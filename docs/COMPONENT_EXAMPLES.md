# Optimized Component Examples

> **Note**: These are examples showing how to apply the new design system to your existing components.
> Copy and adapt these patterns to update your actual components.

---

## 1. Enhanced Button Component

**File**: `src/wj-client/components/Button.tsx`

```tsx
"use client";

import { cn } from "@/lib/utils/cn";
import React from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "icon";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
  "aria-label"?: string;
  "aria-pressed"?: boolean;
  type?: "button" | "submit" | "reset";
}

// Hoisted loading spinner to avoid recreation on each render
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
  variant = "primary",
  size = "md",
  onClick,
  children,
  icon,
  loading = false,
  disabled = false,
  className = "",
  fullWidth = false,
  "aria-label": ariaLabel,
  "aria-pressed": ariaPressed,
  type = "button",
}: ButtonProps) {
  // Size variants - WCAG compliant touch targets
  const sizeClasses = {
    sm: "py-2 px-4 text-sm min-h-[40px]",
    md: "py-2.5 sm:py-3 px-6 text-base min-h-[44px] sm:min-h-[48px]",
    lg: "py-3 sm:py-4 px-8 text-lg min-h-[48px] sm:min-h-[56px]",
  };

  // Base styles (all buttons)
  const baseClasses = cn(
    "font-semibold rounded-lg cursor-pointer",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
    "flex items-center justify-center gap-2 sm:gap-3",
    "transition-all duration-200",
    sizeClasses[size],
    fullWidth ? "w-full" : "w-auto"
  );

  // Variant-specific styles
  const variantClasses = {
    primary: cn(
      "bg-primary-600 text-white shadow-sm",
      "hover:bg-primary-700 hover:shadow-md",
      "active:bg-primary-800 active:scale-[0.98]"
    ),
    secondary: cn(
      "bg-secondary-500 text-white shadow-sm",
      "hover:bg-secondary-600 hover:shadow-md",
      "active:bg-secondary-700 active:scale-[0.98]"
    ),
    outline: cn(
      "bg-white text-primary-600 border-2 border-primary-600",
      "hover:bg-primary-50 hover:shadow-card",
      "active:bg-primary-100 active:scale-[0.98]"
    ),
    ghost: cn(
      "bg-transparent text-primary-600",
      "hover:bg-primary-50",
      "active:bg-primary-100"
    ),
    icon: cn(
      "!p-2 !min-h-[44px] !min-w-[44px] !w-auto",
      "bg-transparent hover:bg-neutral-100",
      "rounded-full"
    ),
  };

  // Icon button (different structure)
  if (variant === "icon") {
    return (
      <button
        type={type}
        className={cn(baseClasses, variantClasses.icon, className)}
        onClick={onClick}
        disabled={loading || disabled}
        aria-label={ariaLabel}
        aria-pressed={ariaPressed}
      >
        {loading ? <LoadingSpinner className="text-primary-600" /> : icon}
      </button>
    );
  }

  // Standard buttons
  return (
    <button
      type={type}
      className={cn(baseClasses, variantClasses[variant], className)}
      onClick={onClick}
      disabled={loading || disabled}
      aria-label={ariaLabel}
    >
      {loading && (
        <LoadingSpinner
          className={
            variant === "primary" || variant === "secondary"
              ? "text-white"
              : "text-primary-600"
          }
        />
      )}
      {icon && !loading && icon}
      {children}
    </button>
  );
});

// USAGE EXAMPLES:

// Primary button
<Button variant="primary" size="md">
  Add Transaction
</Button>

// Secondary button with icon
<Button variant="secondary" icon={<PlusIcon />}>
  Create Wallet
</Button>

// Outline button loading state
<Button variant="outline" loading={true}>
  Saving...
</Button>

// Icon button
<Button variant="icon" icon={<EditIcon />} aria-label="Edit wallet" />

// Full-width button on mobile
<Button variant="primary" fullWidth={true} size="lg">
  Submit
</Button>
```

---

## 2. Enhanced BaseCard Component

**File**: `src/wj-client/components/BaseCard.tsx`

```tsx
"use client";

import { cn } from "@/lib/utils/cn";
import React from "react";

interface BaseCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  shadow?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
  onClick?: () => void;
  variant?: "default" | "gradient" | "bordered";
}

export const BaseCard = React.memo(function BaseCard({
  children,
  className,
  padding = "md",
  shadow = "md",
  hover = false,
  onClick,
  variant = "default",
}: BaseCardProps) {
  const paddingClasses = {
    none: "",
    sm: "p-3 sm:p-4",
    md: "p-4 sm:p-6",
    lg: "p-6 sm:p-8",
  };

  const shadowClasses = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-card",
    lg: "shadow-lg",
  };

  const variantClasses = {
    default: "bg-white",
    gradient: "bg-gradient-to-br from-primary-600 to-primary-700 text-white",
    bordered: "bg-white border-2 border-neutral-200",
  };

  return (
    <div
      className={cn(
        "rounded-lg",
        paddingClasses[padding],
        shadowClasses[shadow],
        variantClasses[variant],
        hover &&
          "hover:shadow-card-hover cursor-pointer transition-shadow duration-200",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
});

// USAGE EXAMPLES:

// Basic card
<BaseCard>
  <h3>Wallet Name</h3>
  <p>Balance: ₫1,000,000</p>
</BaseCard>

// Interactive card with hover effect
<BaseCard hover={true} onClick={handleCardClick}>
  <div>Click me!</div>
</BaseCard>

// Gradient card (for balance display)
<BaseCard variant="gradient" shadow="lg">
  <h2 className="text-2xl font-bold">Total Balance</h2>
  <p className="text-4xl">₫5,432,100</p>
</BaseCard>

// Compact card
<BaseCard padding="sm" shadow="sm">
  <p>Small card</p>
</BaseCard>
```

---

## 3. Enhanced Balance Card (New Component)

**File**: `src/wj-client/components/BalanceCard.tsx`

```tsx
"use client";

import { formatCurrency } from "@/utils/currency-formatter";
import { cn } from "@/lib/utils/cn";
import { formatDistanceToNow } from "date-fns";
import React, { useState } from "react";

interface BalanceChange {
  amount: number;
  percentage: number;
  period: string; // "This month", "This week", etc.
}

interface BalanceCardProps {
  balance: number;
  currency: string;
  change?: BalanceChange;
  lastUpdated?: Date;
  showVerified?: boolean;
}

export function BalanceCard({
  balance,
  currency,
  change,
  lastUpdated,
  showVerified = true,
}: BalanceCardProps) {
  const [isHidden, setIsHidden] = useState(false);
  const isPositive = change && change.amount >= 0;

  return (
    <div className="relative bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-lg shadow-lg p-6 sm:p-8 overflow-hidden">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-primary-100">
                Total Balance
              </span>
              {showVerified && lastUpdated && (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded text-xs font-medium">
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Verified
                </div>
              )}
            </div>

            {/* Balance */}
            <div
              className={cn(
                "text-3xl sm:text-4xl md:text-5xl font-bold mb-1",
                isHidden && "blur-lg select-none"
              )}
            >
              {formatCurrency(balance, currency)}
            </div>

            {/* Change indicator */}
            {change && (
              <div className="flex items-center gap-2 mt-4">
                <div
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-semibold backdrop-blur-sm",
                    isPositive
                      ? "bg-success-500/30 text-success-50"
                      : "bg-danger-500/30 text-danger-50"
                  )}
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    {isPositive ? (
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    ) : (
                      <path
                        fillRule="evenodd"
                        d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    )}
                  </svg>
                  <span>
                    {isPositive ? "+" : ""}
                    {change.percentage.toFixed(2)}%
                  </span>
                </div>
                <span className="text-sm text-primary-100">
                  {change.period}
                </span>
              </div>
            )}
          </div>

          {/* Hide/Show button */}
          <button
            onClick={() => setIsHidden(!isHidden)}
            className="p-2.5 hover:bg-white/10 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center backdrop-blur-sm"
            aria-label={isHidden ? "Show balance" : "Hide balance"}
          >
            {isHidden ? (
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Last updated */}
        {lastUpdated && (
          <div className="pt-4 border-t border-white/20">
            <div className="flex items-center gap-1.5 text-xs text-primary-100">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>
                Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// USAGE EXAMPLE:
<BalanceCard
  balance={5432100}
  currency="VND"
  change={{
    amount: 127500,
    percentage: 2.4,
    period: "This month",
  }}
  lastUpdated={new Date()}
  showVerified={true}
/>
```

---

## 4. Enhanced Modal (BaseModal)

**File**: `src/wj-client/components/modals/BaseModal.tsx`

```tsx
"use client";

import { cn } from "@/lib/utils/cn";
import React, { useEffect, useRef } from "react";

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
  showCloseButton?: boolean;
}

export function BaseModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = "lg",
  showCloseButton = true,
}: BaseModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // ESC key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[
        focusableElements.length - 1
      ] as HTMLElement;

      const handleTab = (e: KeyboardEvent) => {
        if (e.key === "Tab") {
          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      };

      document.addEventListener("keydown", handleTab);
      firstElement?.focus();

      return () => document.removeEventListener("keydown", handleTab);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-neutral-900/50 backdrop-blur-sm",
          "transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal container */}
      <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
        <div
          ref={modalRef}
          className={cn(
            "relative w-full bg-white shadow-modal",
            "transform transition-all duration-300",
            // Mobile: slide up from bottom, full width
            "rounded-t-xl sm:rounded-xl",
            isOpen
              ? "translate-y-0 opacity-100 scale-100"
              : "translate-y-full sm:translate-y-0 opacity-0 scale-95",
            // Desktop: centered, max-width
            maxWidthClasses[maxWidth],
            "max-h-[90vh] sm:max-h-[85vh] flex flex-col"
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
            <h2
              id="modal-title"
              className="text-xl sm:text-2xl font-bold text-neutral-900"
            >
              {title}
            </h2>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-neutral-100 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close modal"
              >
                <svg
                  className="w-6 h-6 text-neutral-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// USAGE EXAMPLE:
<BaseModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  title="Add Transaction"
  maxWidth="lg"
  footer={
    <div className="flex gap-3">
      <Button variant="outline" onClick={onClose} fullWidth>
        Cancel
      </Button>
      <Button variant="primary" onClick={onSubmit} fullWidth loading={isSubmitting}>
        Save
      </Button>
    </div>
  }
>
  <AddTransactionForm onSuccess={handleSuccess} />
</BaseModal>
```

---

## 5. Floating Action Button (FAB)

**File**: `src/wj-client/components/FloatingActionButton.tsx`

```tsx
"use client";

import { cn } from "@/lib/utils/cn";
import React, { useState } from "react";

interface FABAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "success" | "danger";
}

interface FABProps {
  actions: FABAction[];
  position?: "bottom-right" | "bottom-left";
}

export function FloatingActionButton({
  actions,
  position = "bottom-right",
}: FABProps) {
  const [isOpen, setIsOpen] = useState(false);

  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
  };

  const getActionColor = (variant: FABAction["variant"] = "default") => {
    switch (variant) {
      case "success":
        return "bg-success-600 text-white hover:bg-success-700";
      case "danger":
        return "bg-danger-600 text-white hover:bg-danger-700";
      default:
        return "bg-white text-neutral-900 hover:bg-neutral-50";
    }
  };

  return (
    <>
      {/* Backdrop when expanded (mobile only) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-neutral-900/20 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* FAB Container */}
      <div
        className={cn("fixed z-50 md:hidden", positionClasses[position])}
      >
        {/* Action buttons (expand upward) */}
        <div
          className={cn(
            "flex flex-col-reverse gap-3 mb-3",
            "transition-all duration-300",
            isOpen
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4 pointer-events-none"
          )}
        >
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.onClick();
                setIsOpen(false);
              }}
              className={cn(
                "flex items-center gap-3 shadow-lg rounded-full",
                "px-4 py-3 min-h-[56px]",
                "hover:shadow-xl active:scale-95",
                "transition-all duration-200",
                getActionColor(action.variant)
              )}
              style={{
                transitionDelay: isOpen ? `${index * 50}ms` : "0ms",
              }}
            >
              <div className="flex-shrink-0 w-6 h-6">{action.icon}</div>
              <span className="font-medium whitespace-nowrap">
                {action.label}
              </span>
            </button>
          ))}
        </div>

        {/* Main FAB button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-14 h-14 bg-primary-600 text-white rounded-full shadow-floating",
            "flex items-center justify-center",
            "hover:bg-primary-700 hover:shadow-xl",
            "active:scale-95",
            "transition-all duration-200",
            isOpen && "rotate-45"
          )}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>
    </>
  );
}

// USAGE EXAMPLE:
<FloatingActionButton
  actions={[
    {
      label: "Add Transaction",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      onClick: () => setModalType("add-transaction"),
    },
    {
      label: "Transfer Money",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      onClick: () => setModalType("transfer"),
    },
  ]}
  position="bottom-right"
/>
```

---

## 6. Loading Skeleton

**File**: `src/wj-client/components/loading/Skeleton.tsx`

```tsx
import { cn } from "@/lib/utils/cn";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn("bg-neutral-200 rounded animate-pulse", className)}
      aria-hidden="true"
    />
  );
}

// Preset skeleton components
export function CardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-6 w-20" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} />
      ))}
    </div>
  );
}

// USAGE:
{isLoading ? <CardSkeleton /> : <ActualCard data={data} />}
{isLoading ? <TableSkeleton rows={10} /> : <Table data={data} />}
```

---

## 7. Status Badges

**File**: `src/wj-client/components/StatusBadge.tsx`

```tsx
import { cn } from "@/lib/utils/cn";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";
type BadgeSize = "sm" | "md" | "lg";

interface StatusBadgeProps {
  variant: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export function StatusBadge({
  variant,
  size = "md",
  children,
  className,
  icon,
}: StatusBadgeProps) {
  const variantClasses = {
    success: "bg-success-100 text-success-700 border-success-200",
    warning: "bg-secondary-100 text-secondary-700 border-secondary-200",
    danger: "bg-danger-100 text-danger-700 border-danger-200",
    info: "bg-primary-100 text-primary-700 border-primary-200",
    neutral: "bg-neutral-100 text-neutral-700 border-neutral-200",
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
}

// USAGE EXAMPLES:
<StatusBadge variant="success">Active</StatusBadge>
<StatusBadge variant="danger">Expired</StatusBadge>
<StatusBadge
  variant="info"
  icon={
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  }
>
  Verified
</StatusBadge>
```

---

## Migration Checklist

When implementing these components:

### Phase 1: Setup
- [ ] Replace `tailwind.config.ts` with optimized version
- [ ] Update `globals.css` with new CSS variables (if needed)
- [ ] Test color scheme across all pages

### Phase 2: Core Components
- [ ] Update Button component
- [ ] Update BaseCard component
- [ ] Update BaseModal component
- [ ] Test all modals and buttons

### Phase 3: New Components
- [ ] Add BalanceCard component
- [ ] Add FloatingActionButton component
- [ ] Add Skeleton loading components
- [ ] Add StatusBadge component

### Phase 4: Page Updates
- [ ] Update dashboard home page with new BalanceCard
- [ ] Add FAB to mobile layout
- [ ] Replace loading spinners with skeletons
- [ ] Add status badges where appropriate

### Phase 5: Testing
- [ ] Cross-browser testing
- [ ] Mobile device testing
- [ ] Accessibility audit
- [ ] Performance measurement

---

## Quick Start

1. **Copy optimized Tailwind config**:
   ```bash
   cp docs/tailwind.config.optimized.ts src/wj-client/tailwind.config.ts
   ```

2. **Update a component** (start with Button):
   - Copy the enhanced Button code
   - Replace existing Button component
   - Test all pages using buttons

3. **Add new components** (optional):
   - Copy BalanceCard, FAB, Skeleton components
   - Add to your component library
   - Use in appropriate pages

4. **Test everything**:
   ```bash
   npm run dev
   # Test on localhost
   # Check mobile responsive
   # Verify touch targets
   ```

---

**Need help?** Refer to the main [UI_UX_OPTIMIZATION_PLAN.md](./UI_UX_OPTIMIZATION_PLAN.md) for detailed guidance.
