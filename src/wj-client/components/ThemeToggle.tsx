"use client";

import { memo } from "react";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils/cn";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

// Icon components - hoisted outside component to avoid recreation
const SunIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

const MoonIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
    />
  </svg>
);

const SystemIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

export const ThemeToggle = memo(function ThemeToggle({
  className,
  showLabel = false,
  size = "md",
}: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const sizeClasses = {
    sm: "w-8 h-8 p-1.5",
    md: "w-10 h-10 p-2",
    lg: "w-12 h-12 p-2.5",
  };

  const iconSize = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const handleCycleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  const getIcon = () => {
    if (theme === "system") {
      return <SystemIcon className={iconSize[size]} />;
    }
    return resolvedTheme === "dark" ? (
      <MoonIcon className={iconSize[size]} />
    ) : (
      <SunIcon className={iconSize[size]} />
    );
  };

  const getLabel = () => {
    if (theme === "system") {
      return "System";
    }
    return resolvedTheme === "dark" ? "Dark" : "Light";
  };

  const getAriaLabel = () => {
    const currentLabel = getLabel().toLowerCase();
    return `Current theme: ${currentLabel}. Click to cycle themes.`;
  };

  return (
    <button
      onClick={handleCycleTheme}
      className={cn(
        // Base styles
        "inline-flex items-center justify-center",
        "rounded-lg transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-primary-500 focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        // Light mode styles
        "bg-neutral-100 text-neutral-700",
        "hover:bg-neutral-200 hover:shadow-sm",
        "active:bg-neutral-300",
        // Dark mode styles
        "dark:bg-dark-surface dark:text-dark-text",
        "dark:hover:bg-dark-surface-hover dark:hover:shadow-dark-card",
        "dark:active:bg-dark-surface-active",
        "dark:focus-visible:ring-offset-dark-background",
        // Size classes
        sizeClasses[size],
        // Custom gap when label is shown
        showLabel && "gap-2 px-3",
        className
      )}
      aria-label={getAriaLabel()}
      title={getAriaLabel()}
      type="button"
    >
      {getIcon()}
      {showLabel && (
        <span className="text-sm font-medium">{getLabel()}</span>
      )}
    </button>
  );
});

export default ThemeToggle;
