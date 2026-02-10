"use client";

import { memo } from "react";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils/cn";
import { SunIcon, MoonIcon } from "@/components/icons";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

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

  // Dark mode temporarily disabled - toggle is a no-op
  const handleCycleTheme = () => {
    // Theme is always "light" - no cycling available
    // Keeping function for future dark mode support
  };

  const getIcon = () => {
    // Dark mode temporarily disabled - always show sun icon
    return <SunIcon className={iconSize[size]} />;
  };

  const getLabel = () => {
    // Dark mode temporarily disabled - always show "Light"
    return "Light";
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
